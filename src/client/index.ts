const CLASSES_IGNORE: ReadonlySet<number> = new Set([
    13, // Cycles
    14, // Boats
    15, // Helicopters
    16, // Planes
]);

// TopSpeed (km/h) = value × (1.2 / 0.9);
const FLAT_VEL_TO_MS = (1.2 / 0.9) / 3.6;

const MAX_VELOCITY_WHEELING = 8.0;
const WHEELIE_DECEL_RATE    = 0.05;

let wheelieTick: number | null = null;
let wheelieBikeVeh: number = 0;

let cachedVeh: number = 0;
let cachedIgnored: boolean = false;
let cachedIsBike: boolean = false;

setInterval(() => {
    const ped = PlayerPedId();

    if (!DoesEntityExist(ped) || !IsPedInAnyVehicle(ped, false)) {
        if (wheelieTick !== null) stopWheelieControl();
        cachedVeh = 0;
        return;
    }

    const veh = GetVehiclePedIsIn(ped, false);
    if (!DoesEntityExist(veh)) return;

    if (veh !== cachedVeh) {
        const cls = GetVehicleClass(veh);
        cachedIgnored = CLASSES_IGNORE.has(cls);
        cachedIsBike  = !cachedIgnored && IsThisModelABike(GetEntityModel(veh));
        cachedVeh = veh;
    }

    if (cachedIsBike) {
        if (wheelieTick === null || wheelieBikeVeh !== veh) {
            stopWheelieControl();
            startWheelieControl(veh);
        }
    } else if (wheelieTick !== null) {
        stopWheelieControl();
    }

    if (cachedIgnored) return;

    const maxSpeedMs = calculateMaxSpeed(veh);

    if (Entity(veh).state.veh_limit === maxSpeedMs) return;

    updateMaxSpeed(veh, maxSpeedMs);
}, 1000);

function updateMaxSpeed(veh: number, maxSpeed: number): void {
    if (NetworkGetEntityOwner(veh) !== PlayerId()) return;

    Entity(veh).state.set('veh_limit', maxSpeed, true);
    SetVehicleMaxSpeed(veh, maxSpeed);
}

function calculateMaxSpeed(veh: number): number {
    return GetVehicleHandlingFloat(veh, 'CHandlingData', 'fInitialDriveMaxFlatVel') * FLAT_VEL_TO_MS;
}

function startWheelieControl(veh: number): void {
    wheelieBikeVeh = veh;

    let speedCap = GetEntitySpeed(veh);

    wheelieTick = setTick(() => {
        if (!DoesEntityExist(veh) || GetVehiclePedIsIn(PlayerPedId(), false) !== veh) {
            stopWheelieControl();
            return;
        }

        const rearGround = GetVehicleWheelSuspensionCompression(veh, 0) > 0.0;

        if (!rearGround) return;

        if (GetControlNormal(0, 60) > 0.1 || GetControlNormal(0, 62) > 0.1) {
            speedCap = Math.max(speedCap - WHEELIE_DECEL_RATE, MAX_VELOCITY_WHEELING);
            updateMaxSpeed(veh, speedCap);
        } else {
            speedCap = GetEntitySpeed(veh);
            updateMaxSpeed(veh, calculateMaxSpeed(veh));
        }
    });
}

function stopWheelieControl(): void {
    if (wheelieTick !== null) {
        clearTick(wheelieTick);
        wheelieTick = null;
    }

    wheelieBikeVeh = 0;
}