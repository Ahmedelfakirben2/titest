'use client';

import * as React from 'react';
import { useSession } from 'next-auth/react';
import { getDevice } from '@/services/intune';
import { AgreementForm } from '@/components/agreement-form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'; // Added Loader2
import { useToast } from '@/hooks/use-toast';
import { SignInButton, SignOutButton } from '@/components/auth-components';
import { Button } from '@/components/ui/button'; // Import Button for Retry

export default function Home() {
  const { data: session, status } = useSession();
  const [hostname, setHostname] = React.useState<string | null>(null);
  const [isLoadingDevice, setIsLoadingDevice] = React.useState(false);
  const [fetchError, setFetchError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const { toast } = useToast();

  const fetchDeviceData = React.useCallback(async () => {
    if (!session?.accessToken || !session?.userPrincipalName) {
      // Don't fetch if not authenticated or required info is missing
      setFetchError("Autenticación requerida para obtener datos del dispositivo.");
      return;
    }

    setIsLoadingDevice(true);
    setFetchError(null);
    setHostname(null); // Reset hostname on new fetch

    try {
      // Use the access token and userPrincipalName from the session
      const device = await getDevice(session.accessToken, session.userPrincipalName);
      setHostname(device.hostname);
    } catch (err: any) {
      // Log the full error object for better debugging, stringifying for potentially more detail
      console.error("Error fetching device data:", err, JSON.stringify(err, Object.getOwnPropertyNames(err)));
      // Provide more specific error messages if possible
      if (err.message?.includes('Failed to fetch') || err.message?.includes('Network error')) {
          setFetchError("Error de red al intentar conectar con Microsoft Intune. Verifica tu conexión o inténtalo más tarde.");
      } else if (err.message?.includes('401') || err.message?.includes('Unauthorized')) {
         setFetchError("Error de autenticación o permisos insuficientes para acceder a Intune. Por favor, vuelve a iniciar sesión.");
      } else if (err.message?.includes('found')) {
         setFetchError("No se encontró un dispositivo gestionado asignado a tu usuario en Microsoft Intune.");
      } else {
         // Generic error from Graph or other issues
         setFetchError(`No se pudo obtener la información del dispositivo: ${err.message || 'Error desconocido'}. Inténtalo de nuevo más tarde o contacta a soporte.`);
      }
       setHostname(null); // Ensure hostname is null on error
    } finally {
      setIsLoadingDevice(false);
    }
  }, [session]); // Dependency: fetchDeviceData updates when session changes

  // Fetch device data when the user is authenticated
  React.useEffect(() => {
    if (status === 'authenticated' && session?.accessToken && session?.userPrincipalName) {
      // Only fetch if hostname hasn't been successfully fetched yet and no error occurred
      if (!hostname && !fetchError) {
        fetchDeviceData();
      }
    } else if (status === 'unauthenticated') {
       // Reset state if user signs out
       setHostname(null);
       setFetchError(null);
       setIsLoadingDevice(false);
       setIsSubmitted(false);
    }
    // Intentionally exclude fetchDeviceData from dependencies here to avoid infinite loop
    // It's called explicitly when status/session are ready, or on retry.
  }, [status, session?.accessToken, session?.userPrincipalName, hostname, fetchError]);


  const handleAgreementSubmit = async (signed: boolean) => {
    if (!signed || !hostname || !session?.user?.id || !session?.userPrincipalName) return;

    setIsSubmitting(true);
    setFetchError(null); // Clear previous errors

    try {
      // Simulate saving the signed agreement
      console.log(`Agreement signed for user ${session.user.id} (${session.userPrincipalName}) and device ${hostname}`);
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay

      // TODO: Implement actual saving logic here (e.g., save to database, SharePoint, etc.)
      // You might need the session.accessToken here if saving involves calling another protected API.

      setIsSubmitted(true);
      toast({
        title: "Acuerdo Firmado",
        description: "El acuerdo se ha firmado y guardado correctamente.",
        variant: "default",
        duration: 5000, // Keep message longer
      });

    } catch (err) {
      console.error("Error submitting agreement:", err);
      setFetchError("Hubo un error al guardar el acuerdo. Por favor, inténtalo de nuevo.");
      toast({
        title: "Error al Firmar",
        description: "No se pudo guardar el acuerdo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state for authentication
  if (status === 'loading') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-background">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Verificando autenticación...</p>
      </main>
    );
  }

  // Unauthenticated state
  if (status === 'unauthenticated') {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-background">
        <Card className="w-full max-w-md shadow-lg">
           <CardHeader className="text-center">
            <CardTitle className="text-2xl font-semibold">Bienvenido</CardTitle>
            <CardDescription className="pt-2">
                Por favor, inicia sesión con tu cuenta de Microsoft para firmar el acuerdo de tu dispositivo.
            </CardDescription>
           </CardHeader>
           <CardFooter className="flex justify-center">
                <SignInButton />
           </CardFooter>
        </Card>
      </main>
    );
  }

  // Authenticated state - Render based on device fetch status
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-background relative">
       <div className="absolute top-4 right-4">
         <SignOutButton />
       </div>
      <div className="container mx-auto flex flex-col items-center">
        {isLoadingDevice && (
          <Card className="w-full max-w-2xl shadow-lg">
            <CardHeader>
              <Skeleton className="h-8 w-3/4 mx-auto" />
              <Skeleton className="h-4 w-1/2 mx-auto mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex justify-center items-center py-8">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="ml-4 text-muted-foreground">Obteniendo información del dispositivo...</p>
                </div>
            </CardContent>
             <CardFooter>
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        )}

        {!isLoadingDevice && fetchError && (
          <div className="w-full max-w-2xl space-y-4 text-center">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error al Obtener Dispositivo</AlertTitle>
              <AlertDescription>{fetchError}</AlertDescription>
            </Alert>
             {/* Allow retry unless it's a 'device not found' or specific auth error */}
             {!fetchError.includes("No se encontró un dispositivo") && !fetchError.includes("Unauthorized") && !fetchError.includes("401") && !fetchError.includes("403") && (
               <Button onClick={fetchDeviceData} disabled={isLoadingDevice}>
                 {isLoadingDevice ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                 Reintentar
               </Button>
              )}
              {/* Suggest re-login for auth errors */}
               {(fetchError.includes("Unauthorized") || fetchError.includes("401") || fetchError.includes("403")) && (
                <div className="mt-4 text-sm text-muted-foreground">
                  Si el problema persiste, intenta <SignOutButton /> y vuelve a iniciar sesión.
                </div>
               )}
          </div>
        )}

        {!isLoadingDevice && !fetchError && hostname && !isSubmitted && (
          <AgreementForm
            hostname={hostname}
            onSubmit={handleAgreementSubmit}
            isSubmitting={isSubmitting}
           />
        )}

         {/* Case where loading finished, no error, but hostname is still null (should be caught by error handling, but as fallback) */}
         {!isLoadingDevice && !fetchError && !hostname && !isSubmitted && status === 'authenticated' && (
           <Alert className="w-full max-w-2xl">
             <AlertCircle className="h-4 w-4" />
             <AlertTitle>Información no disponible</AlertTitle>
             <AlertDescription>No se pudo cargar la información del dispositivo. Revisa si tienes un dispositivo asignado en Intune o inténtalo de nuevo.</AlertDescription>
              <Button onClick={fetchDeviceData} disabled={isLoadingDevice} className="mt-4">
                 {isLoadingDevice ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                 Reintentar Carga
               </Button>
           </Alert>
         )}

        {!isLoadingDevice && !fetchError && isSubmitted && (
           <Card className="w-full max-w-md shadow-lg text-center p-8">
            <CardHeader>
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <CardTitle className="text-2xl font-semibold">¡Acuerdo Firmado!</CardTitle>
              <CardDescription className="pt-2">
                Gracias por firmar el acuerdo para el dispositivo <strong className="text-primary">{hostname}</strong>. Se ha registrado correctamente.
              </CardDescription>
            </CardHeader>
           </Card>
        )}
      </div>
    </main>
  );
}
