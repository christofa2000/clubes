import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type SupabaseProvisionedUser = {
  id: string;
  email: string;
};

@Injectable()
export class SupabaseAdminService {
  private readonly logger = new Logger(SupabaseAdminService.name);
  private readonly supabase: SupabaseClient | null;

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>('SUPABASE_URL');
    const serviceRoleKey = this.configService.get<string>('SUPABASE_SERVICE_ROLE_KEY');

    if (!url || !serviceRoleKey) {
      this.logger.warn('[SupabaseAdminService] Falta configuración SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY.');
      this.supabase = null;
      return;
    }

    this.supabase = createClient(url, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  /**
   * Invita a un usuario por email usando Supabase Auth.
   * La invitación está pensada para flujos de "set password" vía /auth/set-password en el frontend.
   * El email de invitación incluirá un link que redirige a la página de establecimiento de contraseña.
   * 
   * @param email - Email del usuario a invitar
   * @param metadata - Metadatos opcionales para pasar al usuario (role, clubId, etc.)
   * @returns Usuario creado en Supabase con su ID y email
   */
  async inviteUserByEmail(
    email: string,
    metadata?: {
      role?: string;
      clubId?: string;
      firstName?: string;
      lastName?: string;
    },
  ): Promise<SupabaseProvisionedUser> {
    const client = this.ensureClient();
    const normalizedEmail = email.trim().toLowerCase();

    // Obtener URL del frontend desde variables de entorno, con fallback a localhost:3000
    // IMPORTANTE: Esta URL debe estar configurada en Supabase Dashboard → Authentication → URL Configuration
    // como redirect URL permitida. En producción, agregar también la URL del dominio real.
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') ?? 'http://localhost:3000';
    const normalizedBaseUrl = frontendUrl.replace(/\/$/, '');

    // Construir redirectTo apuntando a /auth/set-password
    // El usuario recibirá un magic link que lo llevará a esta página para establecer su contraseña
    // IMPORTANTE: Esta URL debe estar configurada en Supabase Dashboard → Authentication → URL Configuration
    const redirectTo = `${normalizedBaseUrl}/auth/set-password`;

    // Preparar data para pasar metadatos al usuario invitado
    // Estos metadatos estarán disponibles en user.user_metadata después del login
    const userMetadata: Record<string, unknown> = {};
    if (metadata?.role) {
      userMetadata.role = metadata.role;
    }
    if (metadata?.clubId) {
      userMetadata.clubId = metadata.clubId;
    }
    if (metadata?.firstName) {
      userMetadata.firstName = metadata.firstName;
    }
    if (metadata?.lastName) {
      userMetadata.lastName = metadata.lastName;
    }

    const { data, error } = await client.auth.admin.inviteUserByEmail(normalizedEmail, {
      redirectTo,
      data: Object.keys(userMetadata).length > 0 ? userMetadata : undefined,
    });

    if (error) {
      this.logger.warn(
        `[SupabaseAdminService] inviteUserByEmail failed for ${normalizedEmail}: ${error.message}`,
      );
      if (error.message?.toLowerCase().includes('already registered')) {
        throw new ConflictException('SUPABASE_USER_ALREADY_EXISTS');
      }
      throw new BadRequestException(`SUPABASE_INVITE_FAILED: ${error.message}`);
    }

    if (!data.user) {
      throw new InternalServerErrorException('SUPABASE_INVITE_NO_USER_RETURNED');
    }

    return {
      id: data.user.id,
      email: data.user.email ?? normalizedEmail,
    };
  }

  async createUserWithPassword(email: string, password: string): Promise<SupabaseProvisionedUser> {
    const client = this.ensureClient();
    const normalizedEmail = email.trim().toLowerCase();
    const { data, error } = await client.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true,
    });

    if (error) {
      this.logger.warn(
        `[SupabaseAdminService] createUserWithPassword failed for ${normalizedEmail}: ${error.message}`,
      );
      if (error.message?.toLowerCase().includes('already registered')) {
        throw new ConflictException('SUPABASE_USER_ALREADY_EXISTS');
      }
      throw new BadRequestException(`SUPABASE_CREATE_FAILED: ${error.message}`);
    }

    if (!data.user) {
      throw new InternalServerErrorException('SUPABASE_CREATE_NO_USER_RETURNED');
    }

    return {
      id: data.user.id,
      email: data.user.email ?? normalizedEmail,
    };
  }

  async deleteUser(userId: string): Promise<void> {
    const client = this.ensureClient();
    const { error } = await client.auth.admin.deleteUser(userId);
    if (error) {
      this.logger.warn(
        `[SupabaseAdminService] deleteUser failed for ${userId}: ${error.message}`,
      );
    }
  }

  private ensureClient(): SupabaseClient {
    if (!this.supabase) {
      throw new ServiceUnavailableException('SUPABASE_ADMIN_CLIENT_NOT_CONFIGURED');
    }
    return this.supabase;
  }
}


