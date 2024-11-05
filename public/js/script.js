const socket = io();
console.log("Hello!");

// Initialize the map
const map = L.map("map").setView([0, 0], 10);
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution: "OSRM",
}).addTo(map);

let markers = {};
let routeLine;

// Delhi coordinates
const delhiCoords = { latitude: 11.04019, longitude: 76.08237 };

// Watch user's geolocation
if (navigator.geolocation) {
  navigator.geolocation.watchPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      socket.emit("send-location", { latitude, longitude });
    },
    (err) => {
      console.error(err);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 5000,
    }
  );
}

// Listen for location updates
socket.on("recieved-location", (data) => {
  const { id, latitude, longitude } = data;
  const distanceToDelhi = haversineDistance(
    { latitude, longitude },
    delhiCoords
  );

  console.log(`Distance from user ${id} to Delhi: ${distanceToDelhi.toFixed(2)} km`);

  // Update marker position
  if (markers[id]) {
    markers[id].setLatLng([latitude, longitude]);
  } else {
    markers[id] = L.marker([latitude, longitude]).addTo(map);
  }
  L.Routing.control({
    waypoints: [
      L.latLng(latitude, longitude),
      L.latLng(11.04019, 76.08237)
    ]
  }).addTo(map);
  // Center the map on user's location (optional: limit how frequently this happens)
  map.setView([latitude, longitude], 16);

  // Draw route to Delhi
  //showRoute([latitude, longitude], [delhiCoords.latitude, delhiCoords.longitude]);
});

// Handle user disconnection and remove marker
socket.on("disconnect-user", (id) => {
  if (markers[id]) {
    map.removeLayer(markers[id]);
    delete markers[id];
  }
});

// Function to show route
// function showRoute(start, end) {
//   const routingUrl = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full`;

//   fetch(routingUrl)
//     .then((response) => {
//       if (!response.ok) {
//         throw new Error("Network response was not ok: " + response.statusText);
//       }
//       return response.json();
//     })
//     .then((data) => {
//       console.log("Route data received:", data);

//       if (data.routes && data.routes.length > 0) {
//         const route = data.routes[0].geometry.coordinates;

//         // Remove previous route if it exists
//         if (routeLine) {
//           map.removeLayer(routeLine);
//         }

//         // Draw new route line
//         routeLine = L.polyline(
//           route.map((coord) => [coord[1], coord[0]]),
//           { color: "blue", weight: 4, opacity: 0.7 }
//         ).addTo(map);

//         // Adjust the map view to show the route
//         map.fitBounds(routeLine.getBounds());
//       } else {
//         console.error("No routes found in the response:", data);
//       }
//     })
//     .catch((err) => {
//       console.error("Error fetching route:", err);
//     });
// }

// Function to calculate Haversine distance
function haversineDistance(coords1, coords2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371; // Radius of the Earth in kilometers

  const lat1 = toRad(coords1.latitude);
  const lon1 = toRad(coords1.longitude);
  const lat2 = toRad(coords2.latitude);
  const lon2 = toRad(coords2.longitude);

  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in kilometers
}
