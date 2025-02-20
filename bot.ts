import axios from "axios";
import dotenv from "dotenv";
import { TwitterApi } from "twitter-api-v2";
import https from "https";

dotenv.config();

const twitterClient = new TwitterApi({
    appKey: process.env.API_KEY!,
    appSecret: process.env.API_SECRET_KEY!,
    accessToken: process.env.ACCESS_TOKEN!,
    accessSecret: process.env.ACCESS_TOKEN_SECRET!,
});


let ultimaReserva: number  | null = null;

const obtenerReserva = async () => {
    try {
        const response = await axios.get(process.env.BCRA_API!, {
            httpsAgent: new https.Agent({
                rejectUnauthorized: false, // Ignora la verificación del certificado
            }),
        });

        console.log("Respuesta completa de la API:", response.data); // DEBUG

        const data = response.data;

        if (data.results && data.results.length > 0) {
            return {
                valor: data.results[0].valor,
                fecha: data.results[0].fecha,
            };
        }
        console.log("No se encontraron datos en la API");
        return null;
    } catch (e) {
        console.error("Error al obtener datos del BCRA: ", e);
        return null;
    }
};


const publicarTweet = async (mensaje: string) => {
    try {
        const response = await twitterClient.v2.tweet(mensaje);
        console.log("Tweet publicado con éxito:", response);
    } catch (e) {
        console.error("Error al publicar el tweet:", e);
    }
};

const verificarYPublicar = async () => {
    console.log("Verificando reservas...");
    const reservas = await obtenerReserva();
    if (reservas && reservas.valor !== ultimaReserva) {
        if (ultimaReserva !== null) {
            const cambio = reservas.valor - ultimaReserva;
            const direccion = cambio > 0 ? "⬆️ Subieron" : "⬇️ Bajaron";
            const mensaje = `${direccion} las reservas del BCRA: ${reservas.valor} en millones USD (${cambio} millones).
            Ultima actualización: ${reservas.fecha}`;
            await publicarTweet(mensaje);
        }
        ultimaReserva = reservas.valor;
        console.log("Ultima reserva actualizada:", ultimaReserva);
    }
};

setInterval(verificarYPublicar, 1000 * 60 * 60);
ultimaReserva = 28801;
verificarYPublicar();