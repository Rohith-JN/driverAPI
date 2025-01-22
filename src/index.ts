import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import axios from 'axios';
import cors from 'cors';
import decodePolyline from './decodePolyline';
import { latLngToCell } from 'h3-js';
const endpoint = 'http://localhost:4000/graphql';

async function updateDriverLocation(
  uid: string,
  location: string,
  H3Location: string
) {
  const updateDriverMutation = `
    mutation updateDriverLocation($uid: String!, $location: String!, $H3Location: String!) {
      updateDriverLocation(location: $location,H3Location: $H3Location, uid: $uid) {
        uid
        location
        H3Location
      }
}
  `;

  const variables = {
    uid: uid,
    location: location,
    H3Location: H3Location,
  };

  try {
    await axios.post(
      endpoint,
      {
        query: updateDriverMutation,
        variables: variables,
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.log(`Error updating driver ${uid} location: `, err);
  }
}

dotenv.config();

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: [endpoint],
    credentials: true,
  })
);

const server = http.createServer(app);

let routePolyline: string | null = null;
let currentLocationIndex = 0;
let polylinePoints: any[] = [];

async function getRoute(origin: string, destination: string) {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${process.env.GOOGLE_API_KEY}`
    );
    const route = response.data.routes[0];
    routePolyline = route.overview_polyline.points;
    polylinePoints = decodePolyline(routePolyline!);
    console.log('Route fetched and decoded.');
  } catch (error) {
    console.error('Error fetching route:', error);
  }
}

function simulateDriverMovement(uid: string) {
  setInterval(() => {
    if (currentLocationIndex < polylinePoints.length) {
      const currentLocation = polylinePoints[currentLocationIndex];
      console.log(
        `Driver ${uid} is at: ${currentLocation.lat}, ${currentLocation.lng}`
      );
      updateDriverLocation(
        uid,
        `[${currentLocation.lng}, ${currentLocation.lat}]`,
        latLngToCell(currentLocation.lat, currentLocation.lng, 9)
      );
      currentLocationIndex++;
    } else {
      console.log('Driver has reached the destination.');
      currentLocationIndex = 0;
    }
  }, 10000);
}
app.post('/', async (req, _) => {
  const { uid, origin, destination } = req.body;
  await getRoute(origin, destination);
  simulateDriverMovement(uid);
});

server.listen(1000, () => {
  console.log('Server running on PORT 1000');
});
