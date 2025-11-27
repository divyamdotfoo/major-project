import Header from "@/components/Header";
import Card from "@/components/Card";
import Link from "next/link";
import { API_URL } from "@/lib/config";

interface Stats {
  branches: number;
  students: number;
  rooms: number;
}

async function getStats(): Promise<Stats> {
  try {
    const [branchesRes, studentsRes, roomsRes] = await Promise.all([
      fetch(`${API_URL}/branches`, {
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
      }),
      fetch(`${API_URL}/students`, {
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
      }),
      fetch(`${API_URL}/rooms`, {
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
      }),
    ]);

    if (!branchesRes.ok || !studentsRes.ok || !roomsRes.ok) {
      console.error("API Error:", {
        branches: branchesRes.status,
        students: studentsRes.status,
        rooms: roomsRes.status,
      });
      return { branches: 0, students: 0, rooms: 0 };
    }

    const branches = await branchesRes.json();
    const students = await studentsRes.json();
    const rooms = await roomsRes.json();

    return {
      branches: Array.isArray(branches) ? branches.length : 0,
      students: Array.isArray(students) ? students.length : 0,
      rooms: Array.isArray(rooms) ? rooms.length : 0,
    };
  } catch (error) {
    console.error("Error fetching stats:", error);
    return { branches: 0, students: 0, rooms: 0 };
  }
}

export default async function Dashboard() {
  const stats = await getStats();

  const statsCards = [
    {
      name: "Total Branches",
      value: stats.branches,
      icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
      color: "blue",
      href: "/branches",
    },
    {
      name: "Total Students",
      value: stats.students,
      icon: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
      color: "green",
      href: "/students",
    },
    {
      name: "Total Rooms",
      value: stats.rooms,
      icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z",
      color: "purple",
      href: "/rooms",
    },
  ];

  const colorClasses = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div>
      <Header
        title="Dashboard"
        description="Overview of your seating allocation system"
      />

      <div className="px-8 py-6">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {statsCards.map((stat) => (
            <Link key={stat.name} href={stat.href}>
              <Card className="p-6 transition-shadow hover:shadow-md cursor-pointer">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      {stat.name}
                    </p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={`rounded-full p-3 ${
                      colorClasses[stat.color as keyof typeof colorClasses]
                    }`}
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
                        d={stat.icon}
                      />
                    </svg>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <Link
                href="/branches"
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm font-medium text-gray-700">
                  Add New Branch
                </span>
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
              <Link
                href="/students"
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm font-medium text-gray-700">
                  Add New Student
                </span>
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
              <Link
                href="/rooms"
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm font-medium text-gray-700">
                  Add New Room
                </span>
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
              <Link
                href="/allocations"
                className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span className="text-sm font-medium text-gray-700">
                  Create Allocation
                </span>
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              System Info
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <span className="text-sm text-gray-600">System Status</span>
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                  <span className="mr-1.5 h-2 w-2 rounded-full bg-green-500"></span>
                  Online
                </span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <span className="text-sm text-gray-600">Database</span>
                <span className="text-sm font-medium text-gray-900">
                  PostgreSQL
                </span>
              </div>
              <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                <span className="text-sm text-gray-600">Version</span>
                <span className="text-sm font-medium text-gray-900">2.0.0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Last Updated</span>
                <span className="text-sm font-medium text-gray-900">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
