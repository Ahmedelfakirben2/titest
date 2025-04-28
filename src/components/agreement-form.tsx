
'use client';

import * as React from 'react';
import type { FormEvent } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle } from 'lucide-react';

interface AgreementFormProps {
  hostname: string;
  onSubmit: (signed: boolean) => void;
  isSubmitting: boolean;
}

export function AgreementForm({ hostname, onSubmit, isSubmitting }: AgreementFormProps) {
  const [isSigned, setIsSigned] = React.useState(false);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit(isSigned);
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
          Asimismo, me comprometo a devolver el equipo en las mismas condiciones en las que lo recibí (salvo el desgaste normal por uso) al finalizar mi relación laboral con la empresa o cuando esta así lo requiera.
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
            className="w-full bg-[#2ecc71] hover:bg-[#27ae60] text-white" // Accent Green for Sign button
            disabled={!isSigned || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
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
