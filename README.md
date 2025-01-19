## Todo:

1) Associate driver API with driver ID
2) Driver location should be updating in real-time regardless of client-side connection
3) Driver location should be added periodically to database: last known location
4) On the client-side drivers are located by considering h3 hexagons where the user is present
5) access those drivers by their last known location from DB
6) When rider requests a ride: establish web socket connection with backend to show real-time movement of drivers
7) Create multiple instances of driver API associated with driver ID
8) Update driver location data from mock API since it doesn't matter on the client-side: user-role
