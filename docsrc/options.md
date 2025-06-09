---
title: Configuration Options
---
# Configuration Options

| Option                 | Type                    | Default  | Description                                                                                                                                          |
| ---------------------- | ----------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| resume                 | boolean                 | false    | Whether to resume a connection on disconnect to Lavalink (Server Side) (Note: DOES NOT RESUME WHEN THE LAVALINK SERVER DIES)                         |
| resumeTimeout          | number                  | 30       | Timeout before resuming a connection **in seconds**                                                                                                  |
| resumeByLibrary        | boolean                 | false    | Whether to resume the players by doing it in the library side (Client Side) (Note: TRIES TO RESUME REGARDLESS OF WHAT HAPPENED ON A LAVALINK SERVER) |
| reconnectTries         | number                  | 3        | Number of times to try and reconnect to Lavalink before giving up                                                                                    |
| reconnectInterval      | number                  | 5        | Timeout before trying to reconnect **in seconds**                                                                                                    |
| restTimeout            | number                  | 60       | Time to wait for a response from the Lavalink REST API before giving up **in seconds**                                                               |
| moveOnDisconnect       | boolean                 | false    | Whether to move players to a different Lavalink node when a node disconnects                                                                         |
| userAgent              | string                  | (auto)   | User Agent to use when making requests to Lavalink                                                                                                   |
| structures             | Object\{rest?, player?} | \{}      | Custom structures for shoukaku to use                                                                                                                |
| voiceConnectionTimeout | number                  | 15       | Timeout before abort connection **in seconds**                                                                                                       |
| nodeResolver           | function                | function | Custom node resolver if you want to have your own method of getting the ideal node                                                                   |