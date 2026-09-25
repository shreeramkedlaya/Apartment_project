import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { fetchBroadcasts, type EmergencyBroadcast } from '@/services/emergency.service';

const ActiveAlertBanner = () => {
    const [activeBroadcast, setActiveBroadcast] = useState<EmergencyBroadcast | null>(null);

    const loadActiveBroadcast = async () => {
        try {
            const data = await fetchBroadcasts();
            const active = data.find((b: EmergencyBroadcast) => b.status === 'ACTIVE');
            setActiveBroadcast(active || null);
        } catch (error) {
            console.error("Failed to fetch active broadcasts", error);
        }
    };

    useEffect(() => {
        loadActiveBroadcast();

        const handleEmergencyUpdate = () => {
            loadActiveBroadcast();
        };

        window.addEventListener('EMERGENCY_UPDATE', handleEmergencyUpdate);
        return () => window.removeEventListener('EMERGENCY_UPDATE', handleEmergencyUpdate);
    }, []);

    if (!activeBroadcast) return null;

    return (
        <div className="w-full bg-red-600 text-white px-4 py-3 shadow-lg flex items-center justify-between z-40 relative border-b-4 border-red-800 animate-pulse">
            <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 shrink-0 animate-bounce" />
                <div>
                    <h3 className="font-bold text-sm uppercase tracking-wider">{activeBroadcast.title}</h3>
                    <p className="text-sm text-red-100">{activeBroadcast.message}</p>
                </div>
            </div>
            <div className="hidden md:block text-xs bg-red-800/50 px-3 py-1 rounded font-semibold tracking-wider">
                {activeBroadcast.severity} SEVERITY
            </div>
        </div>
    );
};

export default ActiveAlertBanner;
