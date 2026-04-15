# Stage 1: Build the application
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Copy pom.xml and download dependencies (this layer is cached)
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code and build
COPY src ./src
RUN mvn clean package -DskipTests

# Stage 2: Run the application
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar

# Expose the default Spring Boot port
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
