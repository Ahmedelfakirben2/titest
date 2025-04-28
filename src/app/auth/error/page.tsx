'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const errorMessages: { [key: string]: string } = {
    Signin: 'Hubo un problema al iniciar sesión. Intenta iniciar sesión con una cuenta diferente.',
    OAuthSignin: 'Hubo un problema con el proveedor de autenticación OAuth. Intenta iniciar sesión con una cuenta diferente.',
    OAuthCallback: 'Hubo un problema durante el callback de OAuth. Intenta iniciar sesión con una cuenta diferente.',
    OAuthCreateAccount: 'No se pudo crear una cuenta de usuario con este proveedor OAuth. Intenta iniciar sesión con una cuenta diferente.',
    EmailCreateAccount: 'No se pudo crear una cuenta de usuario con este correo electrónico.',
    Callback: 'Hubo un error en la ruta de callback de OAuth.',
    OAuthAccountNotLinked: 'Esta cuenta ya está vinculada a otro usuario. Inicia sesión con el proveedor original asociado a este correo electrónico.',
    EmailSignin: 'No se pudo enviar el correo electrónico de inicio de sesión.',
    CredentialsSignin: 'Inicio de sesión fallido. Verifica que los detalles proporcionados sean correctos.',
    SessionRequired: 'Se requiere iniciar sesión para acceder a esta página.',
    Default: 'No se pudo iniciar sesión. Ocurrió un error inesperado.',
    Configuration: 'Hay un problema con la configuración del servidor de autenticación.',
    AccessDenied: 'Acceso denegado. No tienes permiso para iniciar sesión o acceder a este recurso.',
    Verification: 'El token de verificación ha expirado o ya ha sido utilizado.',
    MissingSecret: 'Error de configuración del servidor (Missing Secret). Contacta al administrador.',
    MissingAuthorize: 'Error de configuración del servidor (Missing Authorize URL). Contacta al administrador.',
    MissingAdapter: 'Error de configuración del servidor (Missing Adapter). Contacta al administrador.',
    UnsupportedStrategy: 'Error de configuración del servidor (Unsupported Strategy). Contacta al administrador.',
    InvalidCallbackUrl: 'URL de Callback inválida. Contacta al administrador.',
    MissingCSRF: 'Token CSRF inválido o faltante.',
    CallbackRouteError: 'Error en la ruta de callback. Contacta al administrador.',
    MissingProvider: 'El proveedor de autenticación no está configurado correctamente.',
    AccountNotLinked: 'Esta cuenta no está vinculada. Intenta iniciar sesión con el proveedor original.',
    MissingAPIRoute: 'La ruta API de autenticación no se encontró. Verifica la configuración del servidor.'
    // Add more specific error codes and messages as needed from NextAuth.js documentation
  };

  const errorMessage = error ? (errorMessages[error] || errorMessages.Default) : errorMessages.Default;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-background">
      <Card className="w-full max-w-md shadow-lg text-center">
        <CardHeader>
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <CardTitle className="text-xl font-semibold">Error de Autenticación</CardTitle>
          <CardDescription className="pt-2 text-destructive">
            {errorMessage}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Por favor, regresa a la página principal e intenta iniciar sesión nuevamente. Si el problema persiste, contacta al soporte técnico.
          </p>
          <Button asChild>
            <Link href="/">Volver a la Página Principal</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}