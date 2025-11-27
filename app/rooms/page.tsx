"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { DataFormatModal } from "@/components/DataFormatModal";
import { API_URL } from "@/lib/config";

interface Room {
  id: string;
  rows: number;
  cols: number;
  created_at: string;
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    id: "",
    rows: "",
    cols: "",
  });

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/rooms`);
      if (response.ok) {
        const data = await response.json();
        setRooms(data);
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        id: formData.id,
        rows: parseInt(formData.rows),
        cols: parseInt(formData.cols),
      };

      const response = await fetch(`${API_URL}/rooms/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setFormData({
          id: "",
          rows: "",
          cols: "",
        });
        setShowForm(false);
        fetchRooms();
      } else {
        const error = await response.json();
        alert(error.detail || "Failed to create room");
      }
    } catch (error) {
      console.error("Error creating room:", error);
      alert("Failed to create room");
    }
  };

  const handleBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkFile) {
      alert("Please select a file");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("file", bulkFile);

      const response = await fetch(`${API_URL}/rooms/bulk-upload`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        setBulkFile(null);
        setShowBulkUpload(false);
        fetchRooms();
      } else {
        const error = await response.json();
        alert(error.detail || "Failed to upload rooms");
      }
    } catch (error) {
      console.error("Error uploading rooms:", error);
      alert("Failed to upload rooms");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this room?")) return;

    try {
      const response = await fetch(`${API_URL}/rooms/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchRooms();
      } else {
        const error = await response.json();
        alert(error.detail || "Failed to delete room");
      }
    } catch (error) {
      console.error("Error deleting room:", error);
      alert("Failed to delete room");
    }
  };

  return (
    <div>
      <Header 
        title="Rooms Management" 
        description="Manage examination rooms and seating arrangements"
      />

      <div className="px-8 py-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            All Rooms ({rooms.length})
          </h2>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setShowBulkUpload(!showBulkUpload);
                setShowForm(false);
              }}
            >
              {showBulkUpload ? "Cancel" : "Bulk Upload"}
            </Button>
            <Button
              onClick={() => {
                setShowForm(!showForm);
                setShowBulkUpload(false);
              }}
            >
              {showForm ? "Cancel" : "+ Add Room"}
            </Button>
          </div>
        </div>

        {showForm && (
          <Card className="mb-6 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Room</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Room ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.id}
                    onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                    placeholder="e.g., 101"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Rows *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.rows}
                    onChange={(e) => setFormData({ ...formData, rows: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Columns *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={formData.cols}
                    onChange={(e) => setFormData({ ...formData, cols: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-end">
                  <div className="w-full rounded-lg bg-blue-50 px-4 py-2 border border-blue-200">
                    <p className="text-xs text-blue-600 mb-1">Total Capacity</p>
                    <p className="text-lg font-semibold text-blue-900">
                      {formData.rows && formData.cols
                        ? parseInt(formData.rows) * parseInt(formData.cols) * 2
                        : 0}{" "}
                      seats
                    </p>
                    <p className="text-xs text-blue-600 mt-1">2 students per bench</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button type="submit">Create Room</Button>
                <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {showBulkUpload && (
          <Card className="mb-6 p-6">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Bulk Upload Rooms</h3>
              <DataFormatModal
                title="Room Data Format"
                description="Upload a CSV or Excel file with the following columns to bulk add rooms"
                columns={[
                  {
                    name: "id",
                    required: true,
                    description: "Unique room ID or identifier",
                    example: "101"
                  },
                  {
                    name: "rows",
                    required: true,
                    description: "Number of rows in the room (must be positive)",
                    example: "10"
                  },
                  {
                    name: "cols",
                    required: true,
                    description: "Number of columns in the room (must be positive)",
                    example: "8"
                  }
                ]}
                exampleData={[
                  ["101", "10", "8"],
                  ["201", "8", "6"],
                  ["301", "15", "10"]
                ]}
              />
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Upload a CSV or Excel file (.csv, .xlsx, .xls) with room data. Click the info icon above to see the expected format.
              Total capacity will be automatically calculated as: rows × cols × 2 students.
            </p>
            <form onSubmit={handleBulkUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Excel File *
                </label>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  required
                  onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit">Upload Rooms</Button>
                <Button type="button" variant="secondary" onClick={() => setShowBulkUpload(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </Card>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-r-transparent"></div>
          </div>
        ) : rooms.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500">No rooms found</p>
            <p className="mt-2 text-sm text-gray-400">
              Create your first room to get started
            </p>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map((room) => (
              <Card key={room.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Room {room.id}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {room.rows} × {room.cols} layout
                    </p>
                  </div>
                  <button
                    onClick={() => handleDelete(room.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Layout</span>
                    <span className="font-medium text-gray-900">
                      {room.rows} × {room.cols}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Capacity</span>
                    <span className="font-medium text-gray-900">{room.rows * room.cols * 2} seats</span>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded bg-gray-50 p-2">
                      <p className="text-xs text-gray-600">Rows</p>
                      <p className="text-lg font-semibold text-gray-900">{room.rows}</p>
                    </div>
                    <div className="rounded bg-gray-50 p-2">
                      <p className="text-xs text-gray-600">Cols</p>
                      <p className="text-lg font-semibold text-gray-900">{room.cols}</p>
                    </div>
                    <div className="rounded bg-blue-50 p-2">
                      <p className="text-xs text-blue-600">Per Bench</p>
                      <p className="text-lg font-semibold text-blue-900">2</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 text-xs text-gray-400 text-center">
                  Added {new Date(room.created_at).toLocaleDateString()}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

