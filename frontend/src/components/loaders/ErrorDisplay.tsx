import { AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ErrorDisplayProps {
  title?: string;
  message: string;
  retry?: () => void;
}

export function ErrorDisplay({ title = 'Error', message, retry }: ErrorDisplayProps) {
  return (
    <Card className="border-red-500/50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-400" />
          <CardTitle className="text-red-400">{title}</CardTitle>
        </div>
        <CardDescription className="text-slate-400">Something went wrong</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-slate-300 mb-4">{message}</p>
        {retry && (
          <Button variant="outline" onClick={retry}>
            Try Again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
