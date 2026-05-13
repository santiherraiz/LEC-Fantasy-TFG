import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { Svg, G, Polygon, Line, Text as SvgText } from 'react-native-svg';

const { width } = Dimensions.get('window');

interface PlayerRadarChartProps {
  radarData: number[];
  playerNickname: string;
}

export const PlayerRadarChart = React.memo(({ radarData, playerNickname }: PlayerRadarChartProps) => {
  const avgRadarPoints = [50, 60, 50, 65, 50];
  const labels = ['KILLS', 'DEATHS', 'ASSISTS', 'CS/M', 'PTS'];

  return (
    <View className="bg-surface rounded-3xl p-6 border border-surface-light/20 items-center">
      <Svg height="240" width={width - 72} viewBox="0 0 200 220">
        <G transform="translate(0, 15)">
          {[0.2, 0.4, 0.6, 0.8, 1].map((r, i) => (
            <Polygon
              key={i}
              points={radarData.map((_, idx) => {
                const angle = (idx * 2 * Math.PI) / radarData.length - Math.PI / 2;
                return `${100 + 80 * r * Math.cos(angle)},${100 + 80 * r * Math.sin(angle)}`;
              }).join(' ')}
              fill="none" stroke="#374151" strokeWidth="1"
            />
          ))}
          {radarData.map((_, idx) => {
            const angle = (idx * 2 * Math.PI) / radarData.length - Math.PI / 2;
            return <Line key={idx} x1="100" y1="100" x2={100 + 80 * Math.cos(angle)} y2={100 + 80 * Math.sin(angle)} stroke="#374151" strokeWidth="1" />;
          })}

          {/* Media de liga */}
          <Polygon
            points={avgRadarPoints.map((p, idx) => {
              const angle = (idx * 2 * Math.PI) / radarData.length - Math.PI / 2;
              return `${100 + 0.8 * p * Math.cos(angle)},${100 + 0.8 * p * Math.sin(angle)}`;
            }).join(' ')}
            fill="#4B556330" stroke="#6B7280" strokeWidth="1.5"
          />

          {/* Stats Jugador */}
          <Polygon
            points={radarData.map((p, idx) => {
              const angle = (idx * 2 * Math.PI) / radarData.length - Math.PI / 2;
              return `${100 + 0.8 * p * Math.cos(angle)},${100 + 0.8 * p * Math.sin(angle)}`;
            }).join(' ')}
            fill="#00D1FF20" stroke="#00D1FF" strokeWidth="2.5"
          />

          {labels.map((label, idx) => {
            const angle = (idx * 2 * Math.PI) / radarData.length - Math.PI / 2;
            const x = 100 + 95 * Math.cos(angle);
            const y = 100 + 95 * Math.sin(angle);
            return (
              <SvgText 
                key={idx} 
                x={x} 
                y={y} 
                fill="#9CA3AF" 
                fontSize="10" 
                fontWeight="bold" 
                textAnchor="middle"
                alignmentBaseline="middle"
              >
                {label}
              </SvgText>
            );
          })}
        </G>
      </Svg>

      <View className="flex-row mt-6">
        <View className="flex-row items-center mx-4">
          <View className="w-2.5 h-2.5 rounded-full bg-accent-cyan mr-2" />
          <Text className="text-gray-300 text-xs font-bold">{playerNickname}</Text>
        </View>
        <View className="flex-row items-center mx-4">
          <View className="w-2.5 h-2.5 rounded-full bg-gray-500 mr-2" />
          <Text className="text-gray-300 text-xs font-bold">Media Liga</Text>
        </View>
      </View>
    </View>
  );
});
