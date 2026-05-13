import React from 'react';
import { View, Text, FlatList, RefreshControl, ActivityIndicator } from 'react-native';
import CustomHeader from '../../../src/components/CustomHeader';
import { MessageSquare } from 'lucide-react-native';
import { NewsCard } from '../../../src/components/NewsCard';
import { useFeed } from '../../../src/hooks/useFeed';

export default function FeedScreen() {
    const { noticias, loading, refreshing, onRefresh } = useFeed();

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
                renderItem={({ item }) => <NewsCard item={item} />}
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
