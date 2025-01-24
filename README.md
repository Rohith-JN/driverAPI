## Todo
1) Driver location should be updating in real-time regardless of client-side connection
2) On the client-side drivers are located by considering h3 hexagons where the user is present
3) access those drivers by their last known location from DB
4) When rider requests a ride: establish web socket connection with backend to show real-time movement of drivers
5) when rider requests a ride: match drivers based on H3 Index and implement another resolver to send real-time locations of these drivers using web sockets
6) Find drivers by accounting for params: ETA, urban or rural, traffic, frequency etc