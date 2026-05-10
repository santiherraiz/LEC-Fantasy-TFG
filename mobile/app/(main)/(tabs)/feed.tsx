import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, RefreshControl, Image, ActivityIndicator } from 'react-native';
import { useAuthStore } from '../../../src/store/authStore';
import api from '../../../src/api/api';
import { NoticiaLiga, TipoNoticia } from '../../../src/types';
import CustomHeader from '../../../src/components/CustomHeader';
import { MessageSquare, Flame, ShoppingCart, Info, TrendingDown, Trophy } from 'lucide-react-native';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

export default function FeedScreen() {
    const { selectedLigaId } = useAuthStore();
    const [noticias, setNoticias] = useState<NoticiaLiga[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchNoticias = useCallback(async () => {
        if (!selectedLigaId) return;
        try {
            const response = await api.get(`/noticias/${selectedLigaId}`);
            setNoticias(response.data);
        } catch (error) {
            console.error("Error al cargar noticias:", error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedLigaId]);

    useEffect(() => {
        fetchNoticias();
    }, [fetchNoticias]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchNoticias();
    };

    const getEventStyle = (tipo: TipoNoticia) => {
        switch (tipo) {
            case 'CLAUSULAZO':
                return { 
                    label: 'CLAUSULAZO',
                    color: '#FF4B4B', 
                    icon: <Flame color="#FF4B4B" size={18} strokeWidth={2.5} />, 
                    bg: 'bg-red-500/10',
                    border: 'border-red-500/30'
                };
            case 'FICHAJE':
            case 'SUBASTA_GANADA':
                return { 
                    label: 'MERCADO',
                    color: '#00D1FF', 
                    icon: <ShoppingCart color="#00D1FF" size={18} strokeWidth={2.5} />, 
                    bg: 'bg-accent-cyan/10',
                    border: 'border-accent-cyan/30'
                };
            case 'VENTA':
                return { 
                    label: 'OPERACIÓN',
                    color: '#94A3B8', 
                    icon: <TrendingDown color="#94A3B8" size={18} strokeWidth={2.5} />, 
                    bg: 'bg-slate-500/10',
                    border: 'border-slate-500/30'
                };
            case 'RESULTADO_JORNADA':
                return { 
                    label: 'RESULTADOS',
                    color: '#FFD700', 
                    icon: <Trophy color="#FFD700" size={18} strokeWidth={2.5} />, 
                    bg: 'bg-yellow-500/10',
                    border: 'border-yellow-500/30'
                };
            default:
                return { 
                    label: 'SISTEMA',
                    color: '#3B82F6', 
                    icon: <Info color="#3B82F6" size={18} strokeWidth={2.5} />, 
                    bg: 'bg-blue-500/10',
                    border: 'border-blue-500/30'
                };
        }
    };

    const renderNoticia = ({ item }: { item: NoticiaLiga }) => {
        const style = getEventStyle(item.tipoNoticia);
        const date = new Date(item.fecha);
        const timeAgo = formatDistanceToNow(date, { addSuffix: true, locale: es }).replace('alrededor de ', '');

        return (
            <View className={`mb-3 mx-4 rounded-2xl bg-surface border ${style.border} overflow-hidden shadow-sm`}>
                <View className="p-4 flex-row items-center">
                    {/* Icon Container */}
                    <View className={`w-12 h-12 rounded-xl ${style.bg} items-center justify-center mr-4`}>
                        {style.icon}
                    </View>

                    {/* Content */}
                    <View className="flex-1">
                        <View className="flex-row justify-between items-center mb-1">
                            <Text 
                                className="font-black text-[10px] tracking-widest"
                                style={{ color: style.color }}
                            >
                                {style.label}
                            </Text>
                            <Text className="text-gray-500 text-[10px] font-medium">
                                {timeAgo}
                            </Text>
                        </View>
                        <Text className="text-gray-100 text-[13px] font-semibold leading-5 pr-2">
                            {item.mensaje}
                        </Text>
                    </View>

                    {/* Optional Image */}
                    {item.imagenUrl && (
                        <View className="ml-2 shadow-lg">
                            <Image 
                                source={{ uri: item.imagenUrl }} 
                                className="w-14 h-14 rounded-xl bg-midnight/80"
                                resizeMode="contain"
                            />
                        </View>
                    )}
                </View>
            </View>
        );
    };

    if (loading && !refreshing) {
        return (
            <View className="flex-1 bg-midnight justify-center items-center">
                <ActivityIndicator color="#00D1FF" size="large" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-midnight">
            <CustomHeader title="MURO DE ACTIVIDAD" />
            
            <FlatList
                data={noticias}
                renderItem={renderNoticia}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={{ 
                    paddingTop: 20, 
                    paddingBottom: 40 
                }}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl 
                        refreshing={refreshing} 
                        onRefresh={onRefresh} 
                        tintColor="#00D1FF" 
                        colors={["#00D1FF"]}
                        progressBackgroundColor="#1A1D23"
                    />
                }
                ListEmptyComponent={
                  <View className="flex-1 items-center justify-center py-32 px-10">
                    <View className="w-20 h-20 bg-surface rounded-full items-center justify-center mb-6 border border-surface-light/20">
                        <MessageSquare size={32} color="#4B5563" strokeWidth={1.5} />
                    </View>
                    <Text className="text-white text-lg font-bold text-center mb-2">
                        Silencio en la liga
                    </Text>
                    <Text className="text-gray-400 text-center font-medium leading-5">
                      Aún no han ocurrido eventos. ¡Empieza a fichar o lanza un clausulazo para animar esto!
                    </Text>
                  </View>
                }
            />
        </View>
    );
}
