
'use client';

import * as React from 'react';
import type { FormEvent } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'; // Added Loader2

interface AgreementFormProps {
  hostname: string;
  onSubmit: (signed: boolean) => void; // Renamed prop for clarity
  isSubmitting: boolean;
}

export function AgreementForm({ hostname, onSubmit: handleFormSubmit, isSubmitting }: AgreementFormProps) { // Destructure and rename onSubmit prop
  const [isSigned, setIsSigned] = React.useState(false);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    handleFormSubmit(isSigned); // Call the passed onSubmit function
  };

  return (
    <Card className="w-full max-w-2xl shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-semibold text-center">Acuerdo de Asignación y Devolución de Equipo</CardTitle>
        <CardDescription className="text-center pt-1">
          Por favor, lee y firma el siguiente acuerdo para tu dispositivo asignado.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 text-sm">
        <p>
          Yo, el abajo firmante, reconozco la recepción del equipo informático propiedad de la empresa, con nombre de host: <strong className="font-semibold text-primary">{hostname}</strong>.
        </p>
        <p>
          Me comprometo a utilizar este equipo exclusivamente para fines laborales, siguiendo las políticas de seguridad y uso aceptable de la empresa. Entiendo que soy responsable del cuidado y buen estado del equipo asignado.
        </p>
        <p>
          Asimismo, me comprometo a devolver el equipo en lasmmas condiciones en las que lo recibí (salvo el desgaste normal por uso) al finalizar mi relación laboral con la empresa o cuando esta así lo requiera.
        </p>
        <div className="flex items-center space-x-3 pt-4">
          <Checkbox
            id="agreement-sign"
            checked={isSigned}
            onCheckedChange={(checked) => setIsSigned(Boolean(checked))}
            disabled={isSubmitting}
            aria-labelledby="agreement-sign-label"
          />
          <Label htmlFor="agreement-sign" id="agreement-sign-label" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
            He leído y acepto los términos de este acuerdo.
          </Label>
        </div>
      </CardContent>
      <CardFooter>
        <form onSubmit={handleSubmit} className="w-full">
          <Button
            type="submit"
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" // Use theme accent color
            disabled={!isSigned || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-3 h-5 w-5" />
                Firmando...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" /> Firmar Acuerdo
              </>
            )}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
