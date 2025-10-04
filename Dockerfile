FROM denoland/deno:2.5.3

ENV TZ=UTC
ENV PORT=1430

EXPOSE 1430

WORKDIR /app

COPY . .

RUN deno install --allow-scripts

CMD ["sh", "-c", "deno run --allow-all ./entrypoints/migrate.ts && deno run --allow-all ./entrypoints/service.ts"]