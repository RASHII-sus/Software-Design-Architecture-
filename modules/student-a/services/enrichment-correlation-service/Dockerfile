FROM maven:3.9-eclipse-temurin-17-alpine AS build
WORKDIR /app
COPY pom.xml ./pom.xml
COPY shared ./shared
COPY services/enrichment-correlation-service ./services/enrichment-correlation-service
RUN cd /app && mvn clean package -pl services/enrichment-correlation-service -am -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
RUN mkdir -p /app/data
COPY --from=build /app/services/enrichment-correlation-service/target/*.jar app.jar
EXPOSE 8082
ENTRYPOINT ["java", "-jar", "app.jar"]
