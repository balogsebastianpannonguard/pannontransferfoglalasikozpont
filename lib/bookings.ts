import { getCollection } from "./db";
import { ObjectId } from "mongodb";

export type BookingStatus = "pending" | "approved" | "modified" | "cancelled" | "completed";

export interface BookingLog {
  _id?: string | ObjectId;
  bookingId: string;
  action: string;
  details: string;
  performedBy: string; // user email vagy admin név
  timestamp: number;
}

export interface Booking {
  _id?: string | ObjectId;
  portalId: string; // pl. "catl"
  userId: string; // a foglaló user azonosítója / emailje
  
  // Utas adatok
  travelerName: string;
  travelerEmail: string;
  travelerPhone: string;
  companyName: string;
  
  // 2. utas (opcionális)
  secondTravelerEmail?: string;
  secondTravelerPhone?: string;
  
  // Út adatok
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string; // ISO string
  pickupTime: string; // HH:mm
  flightNumber?: string;
  passengersCount: number;
  luggageCount: number;
  
  // Jármű & Fizetés
  requestedVehicleType: string;
  paymentMethod: string;
  priceEstimate?: number;
  
  // Állapot & Hozzárendelés
  status: BookingStatus;
  assignedDriverId?: string;
  assignedVehicleId?: string;
  
  createdAt: number;
  updatedAt: number;
}

export async function getBookingsCollection() {
  return getCollection<Booking>("bookings");
}

export async function getBookingLogsCollection() {
  return getCollection<BookingLog>("booking_logs");
}

export async function createBooking(data: Omit<Booking, "_id" | "status" | "createdAt" | "updatedAt">): Promise<Booking> {
  const col = await getBookingsCollection();
  const now = Date.now();
  
  const booking: Booking = {
    ...data,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  };
  
  const res = await col.insertOne(booking as any);
  const created = await col.findOne({ _id: res.insertedId });
  if (!created) throw new Error("Booking creation failed");
  
  await addBookingLog(res.insertedId.toString(), "CREATED", "Új foglalás létrehozva", data.userId);
  
  return {
    ...created,
    _id: created._id.toString()
  } as unknown as Booking;
}

export async function getBookingsByUser(userId: string): Promise<Booking[]> {
  const col = await getBookingsCollection();
  const docs = await col.find({ userId }).sort({ createdAt: -1 }).toArray();
  return docs.map(d => ({ ...d, _id: d._id.toString() })) as unknown as Booking[];
}

export async function getAllBookings(): Promise<Booking[]> {
  const col = await getBookingsCollection();
  const docs = await col.find().sort({ createdAt: -1 }).toArray();
  return docs.map(d => ({ ...d, _id: d._id.toString() })) as unknown as Booking[];
}

export async function getBookingById(id: string | ObjectId): Promise<Booking | null> {
  const col = await getBookingsCollection();
  const oid = typeof id === "string" ? new ObjectId(id) : id;
  const doc = await col.findOne({ _id: oid });
  if (!doc) return null;
  return { ...doc, _id: doc._id.toString() } as unknown as Booking;
}

export async function updateBookingStatus(
  id: string | ObjectId, 
  status: BookingStatus, 
  performedBy: string, 
  details: string = ""
): Promise<boolean> {
  const col = await getBookingsCollection();
  const oid = typeof id === "string" ? new ObjectId(id) : id;
  
  const res = await col.updateOne(
    { _id: oid },
    { $set: { status, updatedAt: Date.now() } }
  );
  
  if (res.modifiedCount > 0) {
    await addBookingLog(oid.toString(), "STATUS_CHANGE", `Státusz módosítva: ${status}. ${details}`, performedBy);
    return true;
  }
  return false;
}

export async function assignDriverAndVehicle(
  bookingId: string | ObjectId,
  driverId: string,
  vehicleId: string,
  performedBy: string
): Promise<boolean> {
  const col = await getBookingsCollection();
  const oid = typeof bookingId === "string" ? new ObjectId(bookingId) : bookingId;
  
  const res = await col.updateOne(
    { _id: oid },
    { 
      $set: { 
        assignedDriverId: driverId, 
        assignedVehicleId: vehicleId,
        updatedAt: Date.now() 
      } 
    }
  );
  
  if (res.modifiedCount > 0) {
    await addBookingLog(oid.toString(), "ASSIGNMENT", `Sofőr és jármű hozzárendelve.`, performedBy);
    return true;
  }
  return false;
}

export async function addBookingLog(bookingId: string, action: string, details: string, performedBy: string): Promise<void> {
  const col = await getBookingLogsCollection();
  await col.insertOne({
    bookingId,
    action,
    details,
    performedBy,
    timestamp: Date.now()
  } as any);
}

export async function getBookingLogs(bookingId: string): Promise<BookingLog[]> {
  const col = await getBookingLogsCollection();
  const docs = await col.find({ bookingId }).sort({ timestamp: -1 }).toArray();
  return docs.map(d => ({ ...d, _id: d._id.toString() })) as unknown as BookingLog[];
}
