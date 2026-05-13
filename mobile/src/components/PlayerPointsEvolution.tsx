import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { Svg, Defs, LinearGradient, Stop, Line, Path, G, Circle, Text as SvgText } from 'react-native-svg';

const { width } = Dimensions.get('window');

interface WeeklyDataPoint {
  value: number;
  played: boolean;
}

interface PlayerPointsEvolutionProps {
  weeklyData: WeeklyDataPoint[];
  allWeeksAsc: number[];
  avgPoints: string;
}

export const PlayerPointsEvolution = React.memo(({ weeklyData, allWeeksAsc, avgPoints }: PlayerPointsEvolutionProps) => {
  const totalPoints = Math.round(weeklyData.reduce((acc, d) => acc + d.value, 0));

  return (
    <View className="bg-surface rounded-3xl p-6 border border-surface-light/20">
      <View className="h-40 items-center justify-center">
        {weeklyData.length > 0 ? (
          <Svg height="140" width={width - 72}>
            <Defs>
              <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor="#00D1FF" stopOpacity="0.3" />
                <Stop offset="1" stopColor="#00D1FF" stopOpacity="0" />
              </LinearGradient>
            </Defs>

            {[0, 25, 50, 75, 100].map((tick) => (
              <Line
                key={tick}
                x1="0"
                y1={110 - tick}
                x2={width - 72}
                y2={110 - tick}
                stroke="#374151"
                strokeWidth="1"
                strokeDasharray="4, 4"
              />
            ))}

            {(() => {
              const chartW = width - 72;
              const padX = 30;
              const chartH = 110;
              const maxVal = Math.max(...weeklyData.map(d => d.value), 50);

              const points = weeklyData.map((d, i) => {
                const x = padX + (i / (weeklyData.length - 1 || 1)) * (chartW - padX * 2);
                const y = chartH - (d.value / maxVal) * 80;
                return { x, y, val: d.value, played: d.played, week: allWeeksAsc[i] };
              });

              const pathData = points.reduce((acc, p, i) => acc + `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`, "");
              const areaData = `${pathData} L ${points[points.length - 1].x} ${chartH} L ${points[0].x} ${chartH} Z`;

              return (
                <G>
                  <Path d={areaData} fill="url(#grad)" />
                  <Path d={pathData} fill="none" stroke="#00D1FF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  {points.map((p, i) => (
                    <G key={i}>
                      <Circle
                        cx={p.x} cy={p.y}
                        r={p.played ? 5 : 4}
                        fill={p.played ? "#0B0E14" : "#1F2937"}
                        stroke={p.played ? "#00D1FF" : "#4B5563"}
                        strokeWidth="2"
                      />
                      <SvgText
                        x={p.x} y={p.y - 14}
                        fill={p.played ? "white" : "#6B7280"}
                        fontSize="12" fontWeight="bold" textAnchor="middle"
                      >
                        {p.played ? p.val : "NP"}
                      </SvgText>
                      <SvgText
                        x={p.x} y={chartH + 20}
                        fill="#6B7280"
                        fontSize="10" fontWeight="bold" textAnchor="middle"
                      >
                        W{p.week}
                      </SvgText>
                    </G>
                  ))}
                </G>
              );
            })()}
          </Svg>
        ) : (
          <Text className="text-gray-500 italic">Sin datos disponibles</Text>
        )}
      </View>

      <View className="flex-row justify-between mt-6 pt-6 border-t border-surface-light/20">
        <View className="items-center">
          <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1.5">MEDIA</Text>
          <Text className="text-white text-xl font-black uppercase">{avgPoints} PTS</Text>
        </View>
        <View className="items-center">
          <Text className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-1.5">TOTAL TEMP.</Text>
          <Text className="text-accent-cyan text-xl font-black uppercase">
            {totalPoints} PTS
          </Text>
        </View>
      </View>
    </View>
  );
});
