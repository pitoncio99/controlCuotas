'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Cpu, MemoryStick, Server } from "lucide-react";
import { useFirestore, useUser, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import type { Person } from "@/app/lib/definitions";


export default function SystemPage() {
    const firestore = useFirestore();
    const { user } = useUser();

    const peopleCollection = useMemoFirebase(() => firestore && user ? collection(firestore, `users/${user.uid}/people`) : null, [firestore, user]);
    const { data: people, isLoading: peopleLoading } = useCollection<Person>(peopleCollection);

    if (peopleLoading) {
        return <div>Cargando...</div>;
    }

    return (
        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Métricas del Sistema</CardTitle>
                    <CardDescription>Métricas básicas de monitoreo de la aplicación y datos generales.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                     <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Personas Activas</CardTitle>
                            <Users className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">+{people?.length || 0}</div>
                            <p className="text-xs text-muted-foreground">Total de personas en el sistema.</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-medium">Estado del Servidor</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Cpu className="w-5 h-5 text-muted-foreground" />
                                <span className="text-sm font-medium">Uso de CPU</span>
                            </div>
                            <span className="text-sm font-semibold text-green-600">Normal</span>
                            </div>
                            <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <MemoryStick className="w-5 h-5 text-muted-foreground" />
                                <span className="text-sm font-medium">Memoria</span>
                            </div>
                            <span className="text-sm font-semibold">128MB / 512MB</span>
                            </div>
                            <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Server className="w-5 h-5 text-muted-foreground" />
                                <span className="text-sm font-medium">Solicitudes</span>
                            </div>
                            <span className="text-sm font-semibold">45/min</span>
                            </div>
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>
        </div>
    )
}
