import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl, Image } from 'react-native';
import api from '../../api/api';
import { JugadorPuntuacionTotal } from '../../types';
import { ChevronRight, Medal } from 'lucide-react-native';
import CustomHeader from '../../components/CustomHeader';

export default function JugadoresListScreen({ navigation }: any) {
  const [ranking, setRanking] = useState<JugadorPuntuacionTotal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRanking = async () => {
    try {
      const response = await api.get('/jugadores/ranking');
      setRanking(response.data);
    } catch (error) {
      console.error("Error fetching player ranking:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRanking();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchRanking();
  };

  const renderItem = ({ item, index }: { item: JugadorPuntuacionTotal; index: number }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => navigation.navigate('JugadorDetail', { id: item.jugador.id })}
    >
      <View style={styles.rankContainer}>
        {index < 3 ? (
          <Medal color={index === 0 ? '#FBBF24' : index === 1 ? '#9CA3AF' : '#B45309'} size={24} />
        ) : (
          <Text style={styles.rankText}>{index + 1}</Text>
        )}
      </View>
      
      <View style={styles.infoContainer}>
        <Text style={styles.nickname}>{item.jugador.nickname}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
          {item.jugador.equipoLec?.logoUrl && (
            <Image 
              source={{ uri: item.jugador.equipoLec.logoUrl }} 
              style={{ width: 14, height: 14, marginRight: 4 }} 
              resizeMode="contain"
            />
          )}
          <Text style={styles.teamRol}>{item.jugador.equipoLec?.nombre} • {item.jugador.rol}</Text>
        </View>
      </View>

      <View style={styles.pointsContainer}>
        <Text style={styles.pointsValue}>{Math.round(item.puntosTotales)}</Text>
        <Text style={styles.pointsLabel}>PTS</Text>
      </View>

      <ChevronRight color="#4B5563" size={20} />
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CustomHeader 
        showBackButton={true} 
        onBackPress={() => navigation.navigate('Tabs')} 
      />
      <FlatList
        data={ranking}
        renderItem={renderItem}
        keyExtractor={(item) => item.jugador.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3B82F6" />
        }
        ListHeaderComponent={() => (
          <Text style={styles.title}>Ranking Global</Text>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  loaderContainer: {
    flex: 1,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  rankText: {
    color: '#9CA3AF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  infoContainer: {
    flex: 1,
  },
  nickname: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  teamRol: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 2,
  },
  pointsContainer: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  pointsValue: {
    color: '#3B82F6',
    fontSize: 18,
    fontWeight: 'bold',
  },
  pointsLabel: {
    color: '#6B7280',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
