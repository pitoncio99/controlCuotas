'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth, useUser } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const GoogleIcon = () => (
    <svg className="h-5 w-5" viewBox="0 0 24 24">
        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.8 0-5.18-1.89-6.03-4.43H2.39v2.84C4.26 20.98 7.89 23 12 23z" fill="#34A853"/>
        <path d="M5.97 14.05c-.21-.66-.33-1.35-.33-2.05s.12-1.39.33-2.05V7.11H2.39c-.78 1.53-1.23 3.25-1.23 5.04s.45 3.51 1.23 5.04l3.58-2.84z" fill="#FBBC05"/>
        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.89 1 4.26 3.02 2.39 6.25l3.58 2.84c.85-2.54 3.23-4.43 6.03-4.43z" fill="#EA4335"/>
    </svg>
)

export default function LoginPage() {
    const auth = useAuth();
    const router = useRouter();
    const { user, isUserLoading } = useUser();

    useEffect(() => {
        if (!isUserLoading && user) {
            router.push('/dashboard');
        }
    }, [user, isUserLoading, router]);

    const handleGoogleSignIn = async () => {
        const provider = new GoogleAuthProvider();
        try {
            await signInWithPopup(auth, provider);
            router.push('/dashboard');
        } catch (error) {
            console.error('Error during Google Sign-In:', error);
        }
    };
    
    if (isUserLoading || user) {
        return <div className="flex h-screen items-center justify-center">Cargando...</div>
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Bienvenido a CuotaControl</CardTitle>
                    <CardDescription>Inicia sesión para administrar tus finanzas.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button className="w-full" onClick={handleGoogleSignIn}>
                        <GoogleIcon/>
                        Iniciar sesión con Google
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
