let lastVehicle: number | null = null;

setInterval(() => {
    if (!IsPedInAnyVehicle(PlayerPedId(), false))
        return;

    const vehicle = GetVehiclePedIsIn(PlayerPedId(), true);

    if (NetworkGetEntityOwner(vehicle) !== PlayerId())
        return;

    const maxVelocity = GetVehicleHandlingFloat(vehicle, 'CHandlingData', 'fInitialDriveMaxFlatVel') * 0.3704;

    if (lastVehicle == vehicle)
        return;

    SetVehicleMaxSpeed(vehicle, maxVelocity);

    lastVehicle = vehicle;
}, 3500);