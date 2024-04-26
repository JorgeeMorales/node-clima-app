import axios from 'axios';
import fs from 'fs'

class Busquedas {
    historial = [];
    dbPath = './db/database.json';

    constructor() {
        this.leerDB();
    }

    get historialCapitalizado() {
        return this.historial.map( lugar => {
            let palabras = lugar.split(' ');
            palabras = palabras.map( p => p[0].toUpperCase() + p.substring(1) );
            return palabras.join(' ');
        });
    }

    get paramsLocation() {
        return {
            'key': process.env.LOCATION_KEY,
            'format': 'json',
            'limit': 5,
            'language': 'es'
        }
    }

    get paramsWeather() {
        return {
            appid:process.env.OPENWEATHER_KEY,
            units:'metric',
            lang:'es'
        }
    }

    async ciudad( lugar = ''){
        try {
            // petición HTTP
            const instance = axios.create({
                baseURL: `https://us1.locationiq.com/v1/search?q=${lugar}`,
                params: this.paramsLocation
            });

            const resp = await instance.get();
            
            return resp.data.map( lugar => ({
                id: lugar.place_id,
                nombre: lugar.display_name,
                lng: lugar.lon,
                lat: lugar.lat
            }));

        } catch (error) {
            return [];
        }
    }

    async climaLugar( lat, lon ){
        
        try {
            // Petición HTTP - OpenWeather
            const instance = axios.create({
                baseURL : 'https://api.openweathermap.org/data/2.5/weather',
                params: {...this.paramsWeather, lat, lon}
            });

            const response = await instance.get();
            const { weather, main } = response.data;

            return {
                desc: weather[0].description,
                min: main.temp_min,
                max: main.temp_max,
                temp: main.temp
            };

        } catch (error) {
            console.log(error);
        }

    }

    agregarHistorial( lugar = '' ) {

        if( this.historial.includes( lugar.toLocaleLowerCase() )){
            return;
        }

        this.historial = this.historial.splice(0, 5);

        this.historial.unshift( lugar.toLocaleLowerCase() );

        // Grabar en DB
        this.guardarDB();
    }

    guardarDB() {

        const payload = {
            historial: this.historial
        };

        fs.writeFileSync( this.dbPath, JSON.stringify( payload ) );

    }

    leerDB(){
        if ( !fs.existsSync(this.dbPath) ) return;

        const info = fs.readFileSync(this.dbPath, {encoding: 'utf-8'});
        const data = JSON.parse(info);

        this.historial = data.historial;

    }

}

export {Busquedas}