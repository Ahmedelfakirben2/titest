
'use client';

import * as React from 'react';
import { getDevice } from '@/services/intune';
import { AgreementForm } from '@/components/agreement-form';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'; // Added CardFooter
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

// Mock User ID - Replace with actual authentication logic
const MOCK_USER_ID = 'user123';

export default function Home() {
  const [hostname, setHostname] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    async function fetchDeviceData() {
      setIsLoading(true);
      setError(null);
      try {
        // TODO: Replace MOCK_USER_ID with actual user ID from Intune auth
        const device = await getDevice(MOCK_USER_ID);
        setHostname(device.hostname);
      } catch (err) {
        console.error("Error fetching device data:", err);
        setError("No se pudo obtener la información del dispositivo. Por favor, inténtalo de nuevo más tarde.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchDeviceData();
  }, []);

  const handleAgreementSubmit = async (signed: boolean) => {
    if (!signed || !hostname) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Simulate saving the signed agreement
      console.log(`Agreement signed for user ${MOCK_USER_ID} and device ${hostname}`);
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate network delay

      // TODO: Implement actual saving logic here (e.g., save to database, SharePoint, etc.)

      setIsSubmitted(true);
      toast({
        title: "Acuerdo Firmado",
        description: "El acuerdo se ha firmado y guardado correctamente.",
        variant: "default", // Use default for success, or consider a 'success' variant if added
      });

    } catch (err) {
      console.error("Error submitting agreement:", err);
      setError("Hubo un error al guardar el acuerdo. Por favor, inténtalo de nuevo.");
      toast({
        title: "Error al Firmar",
        description: "No se pudo guardar el acuerdo.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-background">
      <div className="container mx-auto flex flex-col items-center">
        {isLoading && (
          <Card className="w-full max-w-2xl shadow-lg">
            <CardHeader>
              <Skeleton className="h-8 w-3/4 mx-auto" />
              <Skeleton className="h-4 w-1/2 mx-auto mt-2" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <div className="flex items-center space-x-3 pt-4">
                <Skeleton className="h-6 w-6 rounded" />
                <Skeleton className="h-4 w-1/3" />
              </div>
            </CardContent>
            <CardFooter>
              <Skeleton className="h-10 w-full" />
            </CardFooter>
          </Card>
        )}

        {!isLoading && error && (
          <Alert variant="destructive" className="w-full max-w-2xl">
             <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!isLoading && !error && hostname && !isSubmitted && (
          <AgreementForm
            hostname={hostname}
            onSubmit={handleAgreementSubmit}
            isSubmitting={isSubmitting}
           />
        )}

        {!isLoading && !error && isSubmitted && (
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
         {!isLoading && !error && !hostname && !isSubmitted && (
           <Alert className="w-full max-w-2xl">
             <AlertCircle className="h-4 w-4" />
             <AlertTitle>Información no disponible</AlertTitle>
             <AlertDescription>No se encontró un dispositivo asignado a tu usuario en Intune.</AlertDescription>
           </Alert>
         )}
      </div>
    </main>
  );
}
