import dotenv from 'dotenv';
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import axios from 'axios';
import cors from 'cors';
import decodePolyline from './decodePolyline';

dotenv.config();

const app = express();
app.use(
  cors({
    origin: ['http://localhost:3000'],
    credentials: true,
  })
);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST'],
  },
});

const origin = process.env.ORIGIN;
const destination = process.env.DESTINATION;

let routePolyline: string | null = null;
let currentLocationIndex = 0;
let polylinePoints: any[] = [];

// Function to get the route using Google Maps Directions API
async function getRoute() {
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

// Function to simulate driver movement
function simulateDriverMovement() {
  setInterval(() => {
    if (currentLocationIndex < polylinePoints.length) {
      const currentLocation = polylinePoints[currentLocationIndex];
      console.log(
        `Driver is at: ${currentLocation.lat}, ${currentLocation.lng}`
      );
      io.emit('driverLocationUpdate', {
        lat: currentLocation.lat,
        lng: currentLocation.lng,
      });
      currentLocationIndex++;
    } else {
      console.log('Driver has reached the destination.');
      currentLocationIndex = 0; // Reset to simulate again if needed
    }
  }, 1000); // Update every 1 second
}

// Start driver simulation
async function startDriverSimulation() {
  await getRoute();
  simulateDriverMovement();
}

io.on('connection', (socket) => {
  console.log('Client connected');

  // Send the current location immediately after connection
  if (currentLocationIndex < polylinePoints.length) {
    const currentLocation = polylinePoints[currentLocationIndex];
    socket.emit('driverLocationUpdate', {
      lat: currentLocation.lat,
      lng: currentLocation.lng,
    });
  }

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start the server and simulation
server.listen(1000, () => {
  console.log('Server running on http://localhost:1000');
  startDriverSimulation(); // Start the simulation
});

// Todo:

// 1) Associate driver API with driver ID
// 2) Driver location should be updating in real-time regardless of client-side connection
// 3) Driver location should be added periodically to database: last known location
// 6) On the client-side drivers are located by h3 hexagons where user location is present
// 7) access those drivers by their last known location from DB
// 4) When rider requests a ride: establish web socket connection with backend to show real-time movement of drivers
// 5) Create multiple instances of driver API associated with driver ID
