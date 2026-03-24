const VEHICLE_CLASSES_IGNORE = [
    13, // Cycles
    14, // Boats
    15, // Helicopters
    16, // Planes
];

let lastVehicle: number | null = null;

setInterval(() => {
    if (!IsPedInAnyVehicle(PlayerPedId(), false))
        return;

    const vehicle = GetVehiclePedIsIn(PlayerPedId(), true);

    if (NetworkGetEntityOwner(vehicle) !== PlayerId())
        return;

    if (lastVehicle == vehicle)
        return;

    lastVehicle = vehicle;

    if (VEHICLE_CLASSES_IGNORE.includes(GetVehicleClass(vehicle)))
        return;

    const maxVelocity = GetVehicleHandlingFloat(vehicle, 'CHandlingData', 'fInitialDriveMaxFlatVel') * 0.3704;

    SetVehicleMaxSpeed(vehicle, maxVelocity);
}, 3500);