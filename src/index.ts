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

const driverState: Record<
  string,
  { currentLocationIndex: number; polylinePoints: any[] }
> = {};

async function getRoute(origin: string, destination: string): Promise<any[]> {
  try {
    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${process.env.GOOGLE_API_KEY}`
    );
    const route = response.data.routes[0];
    const polylinePoints = decodePolyline(route.overview_polyline.points);
    console.log('Route fetched and decoded.');
    return polylinePoints;
  } catch (error) {
    console.error('Error fetching route:', error);
    throw new Error('Could not fetch route');
  }
}

function simulateDriverMovement(uid: string) {
  const driver = driverState[uid];
  if (!driver) return;

  const intervalId = setInterval(() => {
    if (driver.currentLocationIndex < driver.polylinePoints.length) {
      const currentLocation =
        driver.polylinePoints[driver.currentLocationIndex];
      console.log(
        `Driver ${uid} is at: ${currentLocation.lat}, ${currentLocation.lng}`
      );
      updateDriverLocation(
        uid,
        `[${currentLocation.lng}, ${currentLocation.lat}]`,
        latLngToCell(currentLocation.lat, currentLocation.lng, 8)
      );
      driver.currentLocationIndex++;
    } else {
      console.log(`Driver ${uid} has reached the destination.`);
      clearInterval(intervalId); // Stop the simulation for this driver
    }
  }, 10000);
}

app.post('/', async (req, res) => {
  const { uid, origin, destination } = req.body;

  if (driverState[uid]) {
    res
      .status(400)
      .json({ message: 'Simulation already running for this driver.' });
    return;
  }

  try {
    const polylinePoints = await getRoute(origin, destination);
    driverState[uid] = {
      currentLocationIndex: 0,
      polylinePoints,
    };
    simulateDriverMovement(uid);
    res.status(200).json({ message: 'Simulation started for driver.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

server.listen(1000, () => {
  console.log('Server running on PORT 1000');
});
