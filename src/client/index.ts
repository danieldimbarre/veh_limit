const VEHICLE_CLASSES_IGNORE: readonly number[] = [
    13, // Cycles
    14, // Boats
    15, // Helicopters
    16 // Planes
];

const COEFF = 0.3704; // Convert from GTA units to km/h

setInterval(() => {
    const ped = PlayerPedId();

    if (!DoesEntityExist(ped) || !IsPedInAnyVehicle(ped, false))
        return;

    const veh = GetVehiclePedIsIn(ped, true);

    if (!DoesEntityExist(veh))
        return;

    if (VEHICLE_CLASSES_IGNORE.includes(GetVehicleClass(veh)))
        return;

    const max_velocity = GetVehicleHandlingFloat(veh, 'CHandlingData', 'fInitialDriveMaxFlatVel') * COEFF;

    if (Entity(veh).state.veh_limit === max_velocity)
        return;

    Entity(veh).state.set('veh_limit', max_velocity, false);

    SetEntityMaxSpeed(veh, max_velocity);
}, 3500);