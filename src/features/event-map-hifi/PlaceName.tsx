import styles from "./PlaceName.module.css"
import { CarIcon, MotorcycleIcon } from "./CategoryIcons"
import { VEHICLE_LABELS, type MapLocation } from "./mapLocations"

/** A place's name, followed by vehicle icons for parking (e.g. "Parkir Seni Rupa 🏍 🚗"). */
export default function PlaceName({ location }: { location: MapLocation }) {
  const vehicles = location.vehicles ?? []
  return (
    <>
      {location.name}
      {vehicles.length > 0 ? (
        <span
          className={styles.vehicles}
          role="img"
          aria-label={`Untuk ${vehicles.map((v) => VEHICLE_LABELS[v].toLowerCase()).join(" dan ")}`}
        >
          {vehicles.map((v) =>
            v === "car" ? (
              <CarIcon key={v} className={styles.icon} />
            ) : (
              <MotorcycleIcon key={v} className={styles.icon} />
            ),
          )}
        </span>
      ) : null}
    </>
  )
}
