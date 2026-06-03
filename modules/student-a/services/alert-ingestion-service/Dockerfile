FROM maven:3.9-eclipse-temurin-17-alpine AS build
WORKDIR /app
COPY pom.xml ./pom.xml
COPY shared ./shared
COPY services/alert-ingestion-service ./services/alert-ingestion-service
RUN cd /app && mvn clean package -pl services/alert-ingestion-service -am -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN mkdir -p /app/data
COPY --from=build /app/services/alert-ingestion-service/target/*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
