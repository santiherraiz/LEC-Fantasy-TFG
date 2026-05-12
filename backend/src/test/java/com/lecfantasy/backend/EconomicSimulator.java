package com.lecfantasy.backend;

import java.util.ArrayList;
import java.util.List;

public class EconomicSimulator {

    static class PlayerState {
        String name;
        String tier;
        double price;
        double lastPrice;
        String tendency = "ESTABLE";
        List<Double> priceHistory = new ArrayList<>();

        PlayerState(String name, String tier, double startPrice) {
            this.name = name;
            this.tier = tier;
            this.price = startPrice;
            this.lastPrice = startPrice;
            this.priceHistory.add(startPrice);
        }
    }

    public static void main(String[] args) {
        System.out.println("# SIMULACIÓN DE ECONOMÍA FANTASY LEC - TEMPORADA COMPLETA (9 SEMANAS)");
        System.out.println("Reglas: Tope 5% diario, Suelo 1000€, Ponderación: Rendimiento 60%, Calendario 25%, Demanda 15%\n");

        List<PlayerState> players = new ArrayList<>();
        players.add(new PlayerState("Caps (G2)", "S", 35000));
        players.add(new PlayerState("Elyoya (MAD)", "A", 15000));
        players.add(new PlayerState("Supa (MAD)", "A", 15000));
        players.add(new PlayerState("Jackies (GXR)", "C", 5000));
        players.add(new PlayerState("Sub (Extra)", "C", 5000));

        double globalAvgPoints = 15.0; // Media de la LEC

        for (int week = 1; week <= 9; week++) {
            // Simulamos 7 días de fluctuación por semana
            for (int day = 1; day <= 7; day++) {
                for (PlayerState p : players) {
                    double variacionFinal = 0;

                    // 1. Rendimiento (Simulado según el jugador)
                    double puntos = 15.0; // Por defecto la media
                    if (p.name.contains("Caps")) puntos = 25.0; // Superestrella
                    if (p.name.contains("Elyoya")) puntos = 18.0; // Consistente
                    if (p.name.contains("Supa")) puntos = 14.0; // Volátil
                    if (p.name.contains("Jackies")) puntos = 12.0; // Novato
                    if (p.name.contains("Sub")) puntos = 0.0; // Inactivo

                    double diferencia = puntos - globalAvgPoints;
                    variacionFinal += (diferencia * 0.005) * 0.60;

                    // 2. Calendario (Simulado)
                    // Caps siempre tiene partidos, Sub descansa a veces
                    if (!p.name.contains("Sub")) {
                        variacionFinal += (0.02 * 0.25); // +2% por tener partidos
                    } else {
                        variacionFinal += (-0.01 * 0.25); // -1% por no jugar
                    }

                    // 3. Demanda (Simulada)
                    if (p.tier.equals("S")) variacionFinal += (2 * 0.01) * 0.15; // 2 compras/día
                    if (p.tier.equals("A")) variacionFinal += (1 * 0.01) * 0.15; // 1 compra/día

                    // Inactividad
                    if (puntos == 0) {
                        variacionFinal -= 0.04;
                    }

                    // Muros
                    if (variacionFinal > 0.05) variacionFinal = 0.05;
                    if (variacionFinal < -0.05) variacionFinal = -0.05;

                    p.price = Math.round(p.price * (1 + variacionFinal));
                    if (p.price < 1000) p.price = 1000;
                }
            }
            // Al final de la semana guardamos el precio
            for (PlayerState p : players) {
                p.priceHistory.add(p.price);
            }
        }

        // Generar Tabla Markdown
        System.out.print("| Jugador (Tier) | Inicio | Sem 1 | Sem 2 | Sem 3 | Sem 4 | Sem 5 | Sem 6 | Sem 7 | Sem 8 | Sem 9 | Var. Total |\n");
        System.out.print("| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n");

        for (PlayerState p : players) {
            System.out.print("| " + p.name + " (" + p.tier + ") ");
            for (Double price : p.priceHistory) {
                System.out.print("| " + String.format("%.0f", price) + "€ ");
            }
            double varTotal = ((p.price - p.priceHistory.get(0)) / p.priceHistory.get(0)) * 100;
            System.out.print("| " + String.format("%.1f", varTotal) + "% |\n");
        }
        
        System.out.println("\n### Conclusiones de la simulación:");
        System.out.println("1. **Tier S (Caps):** Crece de forma sostenida gracias a su rendimiento y demanda, pero el tope del 5% diario evita que se dispare a millones.");
        System.out.println("2. **Tier A (Elyoya/Supa):** Se mantienen en rangos competitivos. Si el rendimiento baja de la media, el precio se estanca.");
        System.out.println("3. **Tier C (Jackies):** Al estar por debajo de la media, su precio tiende a bajar o mantenerse bajo.");
        System.out.println("4. **Inactividad (Sub):** La depreciación del 4% diario + falta de partidos lo empuja rápidamente hacia el suelo de 1.000€.");
    }
}
