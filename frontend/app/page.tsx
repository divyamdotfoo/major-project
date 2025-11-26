"use client";

import { useEffect, useState } from "react";

const API_URL = "http://localhost:8000";

interface Student {
  roll_no: string;
  course: string;
}

interface Class {
  class_name: string;
  uploaded_at: string | null;
  total_students: number;
  students?: Student[];
}

interface Room {
  room_name: string;
  created_at: string | null;
  total_capacity: number;
  configuration?: {
    rows: number;
    cols: number;
    total_capacity: number;
  };
}

export default function Home() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [classesRes, roomsRes] = await Promise.all([
        fetch(`${API_URL}/classes`),
        fetch(`${API_URL}/rooms`),
      ]);

      if (!classesRes.ok || !roomsRes.ok) {
        throw new Error("Failed to fetch data from backend");
      }

      const classesData = await classesRes.json();
      const roomsData = await roomsRes.json();

      setClasses(classesData.classes || []);
      setRooms(roomsData.rooms || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClassDetails = async (className: string) => {
    try {
      const res = await fetch(`${API_URL}/classes/${className}`);
      if (!res.ok) throw new Error("Failed to fetch class details");
      const data = await res.json();
      setSelectedClass(data);
    } catch (err) {
      console.error("Error fetching class details:", err);
    }
  };

  const fetchRoomDetails = async (roomName: string) => {
    try {
      const res = await fetch(`${API_URL}/rooms/${roomName}`);
      if (!res.ok) throw new Error("Failed to fetch room details");
      const data = await res.json();
      setSelectedRoom(data);
    } catch (err) {
      console.error("Error fetching room details:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Seating Allocation System
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-red-800">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
            <p className="mt-2 text-sm">
              Make sure your backend is running on {API_URL}
            </p>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-900">Classes</h2>
              <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
                {classes.length} total
              </span>
            </div>

            {classes.length === 0 ? (
              <div className="rounded-lg bg-white p-8 text-center shadow">
                <p className="text-gray-500">No classes found</p>
                <p className="mt-2 text-sm text-gray-400">
                  Upload a class using the backend API
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {classes.map((cls) => (
                  <div
                    key={cls.class_name}
                    className="cursor-pointer rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-lg"
                    onClick={() => fetchClassDetails(cls.class_name)}
                  >
                    <h3 className="text-lg font-semibold text-gray-900">
                      {cls.class_name}
                    </h3>
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                      <span>{cls.total_students} students</span>
                      {cls.uploaded_at && (
                        <span>
                          {new Date(cls.uploaded_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-900">Rooms</h2>
              <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                {rooms.length} total
              </span>
            </div>

            {rooms.length === 0 ? (
              <div className="rounded-lg bg-white p-8 text-center shadow">
                <p className="text-gray-500">No rooms found</p>
                <p className="mt-2 text-sm text-gray-400">
                  Add a room using the backend API
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {rooms.map((room) => (
                  <div
                    key={room.room_name}
                    className="cursor-pointer rounded-lg bg-white p-6 shadow transition-shadow hover:shadow-lg"
                    onClick={() => fetchRoomDetails(room.room_name)}
                  >
                    <h3 className="text-lg font-semibold text-gray-900">
                      {room.room_name}
                    </h3>
                    <div className="mt-2 flex items-center gap-4 text-sm text-gray-600">
                      <span>Capacity: {room.total_capacity}</span>
                      {room.created_at && (
                        <span>
                          {new Date(room.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {selectedClass && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="max-h-[80vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedClass.class_name}
                </h3>
                <button
                  onClick={() => setSelectedClass(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <p className="mb-4 text-gray-600">
                Total Students: {selectedClass.total_students}
              </p>
              {selectedClass.students && selectedClass.students.length > 0 && (
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Roll No
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Course
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {selectedClass.students.map((student, idx) => (
                        <tr key={idx}>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            {student.roll_no}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                            {student.course}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {selectedRoom && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  {selectedRoom.room_name}
                </h3>
                <button
                  onClick={() => setSelectedRoom(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              {selectedRoom.configuration && (
                <div className="space-y-3">
                  <div className="flex justify-between rounded-lg bg-gray-50 p-4">
                    <span className="text-gray-600">Rows:</span>
                    <span className="font-semibold text-gray-900">
                      {selectedRoom.configuration.rows}
                    </span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-gray-50 p-4">
                    <span className="text-gray-600">Columns:</span>
                    <span className="font-semibold text-gray-900">
                      {selectedRoom.configuration.cols}
                    </span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-gray-50 p-4">
                    <span className="text-gray-600">Total Capacity:</span>
                    <span className="font-semibold text-gray-900">
                      {selectedRoom.configuration.total_capacity}
                    </span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-gray-50 p-4">
                    <span className="text-gray-600">Seats per Bench:</span>
                    <span className="font-semibold text-gray-900">2</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
