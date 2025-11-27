"use client";

import { useState, useEffect } from "react";
import Header from "@/components/Header";
import Card from "@/components/Card";
import Button from "@/components/Button";
import { API_URL } from "@/lib/config";
import CreatePlanModal from "./CreatePlanModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SeatingPlan {
  id: number;
  name: string;
  exam_date: string | null;
  description: string | null;
  total_students: number;
  total_rooms: number;
  data_source: string;
  created_at: string;
}

export default function AllocationsPage() {
  const [plans, setPlans] = useState<SeatingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SeatingPlan | null>(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch(`${API_URL}/seating-plans/`);
      if (response.ok) {
        const data = await response.json();
        setPlans(data);
      }
    } catch (error) {
      console.error("Error fetching plans:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (planId: number) => {
    if (!confirm("Are you sure you want to delete this plan?")) return;

    try {
      const response = await fetch(`${API_URL}/seating-plans/${planId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setPlans(plans.filter((p) => p.id !== planId));
      }
    } catch (error) {
      console.error("Error deleting plan:", error);
    }
  };

  const handleViewPlan = async (planId: number) => {
    try {
      const response = await fetch(`${API_URL}/seating-plans/${planId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedPlan(data);
      }
    } catch (error) {
      console.error("Error fetching plan details:", error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div>
      <Header
        title="Seating Allocation Plans"
        description="Create and manage exam seating allocation plans"
      />

      <div className="px-8 py-6">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-semibold">All Plans</h2>
          <Button onClick={() => setShowCreateModal(true)}>
            Create New Plan
          </Button>
        </div>

        {loading ? (
          <Card className="p-12 text-center">
            <div className="text-gray-500">Loading plans...</div>
          </Card>
        ) : plans.length === 0 ? (
          <Card className="p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No seating plans yet
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Get started by creating your first seating allocation plan.
            </p>
            <div className="mt-6">
              <Button onClick={() => setShowCreateModal(true)}>
                Create Your First Plan
              </Button>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                className="p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {plan.name}
                  </h3>
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      plan.data_source === "existing"
                        ? "bg-blue-100 text-blue-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {plan.data_source}
                  </span>
                </div>

                {plan.exam_date && (
                  <p className="text-sm text-gray-600 mb-2">
                    Date: {plan.exam_date}
                  </p>
                )}

                {plan.description && (
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                    {plan.description}
                  </p>
                )}

                <div className="flex gap-4 text-sm text-gray-600 mb-4">
                  <div>
                    <span className="font-medium">{plan.total_students}</span>{" "}
                    students
                  </div>
                  <div>
                    <span className="font-medium">{plan.total_rooms}</span>{" "}
                    rooms
                  </div>
                </div>

                <p className="text-xs text-gray-400 mb-4">
                  Created: {formatDate(plan.created_at)}
                </p>

                <div className="flex gap-2">
                  <Button
                    variant="primary"
                    className="flex-1 text-sm"
                    onClick={() => handleViewPlan(plan.id)}
                  >
                    View Details
                  </Button>
                  <Button
                    variant="danger"
                    className="text-sm"
                    onClick={() => handleDelete(plan.id)}
                  >
                    Delete
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <CreatePlanModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchPlans();
          }}
        />
      </Dialog>

      <Dialog
        open={!!selectedPlan}
        onOpenChange={(open) => !open && setSelectedPlan(null)}
      >
        {selectedPlan && (
          <PlanDetailsModal
            plan={selectedPlan}
            onClose={() => setSelectedPlan(null)}
          />
        )}
      </Dialog>
    </div>
  );
}

function PlanDetailsModal({
  plan,
  onClose,
}: {
  plan: any;
  onClose: () => void;
}) {
  return (
    <DialogContent className="md:max-w-6xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-2xl">{plan.name}</DialogTitle>
        <div className="flex flex-wrap gap-3 mt-2">
          {plan.exam_date && (
            <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              <svg
                className="w-4 h-4 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              {plan.exam_date}
            </span>
          )}
          <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
            {plan.total_students} Students
          </span>
          <span className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
            {plan.total_rooms} Rooms
          </span>
          <span className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm capitalize">
            {plan.data_source} Data
          </span>
        </div>
      </DialogHeader>

      <div className="mt-4">
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">Plan Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="text-blue-600 text-sm font-medium mb-1">
                Students Allocated
              </div>
              <div className="text-2xl font-bold text-blue-900">
                {plan.total_students}
              </div>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <div className="text-purple-600 text-sm font-medium mb-1">
                Rooms Utilized
              </div>
              <div className="text-2xl font-bold text-purple-900">
                {plan.total_rooms}
              </div>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="text-green-600 text-sm font-medium mb-1">
                Data Source
              </div>
              <div className="text-2xl font-bold text-green-900 capitalize">
                {plan.data_source}
              </div>
            </div>
          </div>
        </div>

        {plan.description && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">Description</h3>
            <p className="text-gray-600">{plan.description}</p>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Room Allocations</h3>
            <div className="flex gap-3 text-xs">
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 bg-blue-200 rounded"></span>
                <span className="text-gray-600">Branch</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 bg-purple-200 rounded"></span>
                <span className="text-gray-600">Subject</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-3 h-3 bg-green-200 rounded"></span>
                <span className="text-gray-600">Semester</span>
              </span>
            </div>
          </div>
          {plan.allocation_data.allocations?.map(
            (allocation: any, idx: number) => {
              const totalSeats = allocation.rows * allocation.cols * 2;
              const occupiedSeats = allocation.grid
                .flat()
                .reduce((sum: number, bench: any[]) => sum + bench.length, 0);
              return (
                <div
                  key={idx}
                  className="mb-6 border border-gray-200 rounded-lg overflow-hidden"
                >
                  <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900">
                        Room: {allocation.room_id}
                      </h4>
                      <div className="flex gap-4 text-sm text-gray-600">
                        <span>
                          {allocation.rows} × {allocation.cols} benches
                        </span>
                        <span>
                          {occupiedSeats} / {totalSeats} seats occupied
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto p-4">
                    <table className="w-full border-collapse border border-gray-300">
                      <tbody>
                        {allocation.grid.map((row: any[], rowIdx: number) => (
                          <tr key={rowIdx}>
                            {row.map((bench: any[], colIdx: number) => (
                              <td
                                key={colIdx}
                                className="border border-gray-300 p-3 text-center min-w-[200px]"
                              >
                                {bench.length > 0 ? (
                                  <div className="space-y-2">
                                    {bench.map((student, sIdx) => {
                                      // Handle both old format (string) and new format (object)
                                      const isObject =
                                        typeof student === "object";
                                      const rollNo = isObject
                                        ? student.roll_no
                                        : student;
                                      const name = isObject
                                        ? student.name
                                        : student;
                                      const branch = isObject
                                        ? student.branch_name || student.branch
                                        : "";
                                      const subject = isObject
                                        ? student.subject_name ||
                                          student.subject
                                        : "";
                                      const semester = isObject
                                        ? student.semester
                                        : null;

                                      return (
                                        <div
                                          key={sIdx}
                                          className="bg-blue-50 border border-blue-200 text-blue-900 px-3 py-2 rounded-md"
                                        >
                                          <div className="font-semibold text-base mb-1">
                                            {rollNo}
                                          </div>
                                          {isObject && (
                                            <>
                                              {name && name !== rollNo && (
                                                <div className="text-xs text-blue-700 mb-1">
                                                  {name}
                                                </div>
                                              )}
                                              <div className="flex flex-wrap gap-1 justify-center">
                                                {branch && (
                                                  <span className="inline-block px-2 py-0.5 bg-blue-200 text-blue-900 rounded text-xs">
                                                    {branch}
                                                  </span>
                                                )}
                                                {subject && (
                                                  <span className="inline-block px-2 py-0.5 bg-purple-200 text-purple-900 rounded text-xs">
                                                    {subject}
                                                  </span>
                                                )}
                                                {semester && (
                                                  <span className="inline-block px-2 py-0.5 bg-green-200 text-green-900 rounded text-xs">
                                                    Sem {semester}
                                                  </span>
                                                )}
                                              </div>
                                            </>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div className="text-gray-400 py-4">
                                    Empty
                                  </div>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            }
          )}

          {plan.allocation_data.unallocated_students?.length > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-medium text-yellow-900 mb-3">
                Unallocated Students (
                {plan.allocation_data.unallocated_students.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {plan.allocation_data.unallocated_students.map(
                  (student: any, idx: number) => {
                    const isObject = typeof student === "object";
                    const rollNo = isObject ? student.roll_no : student;
                    const name = isObject ? student.name : null;
                    const branch = isObject
                      ? student.branch_name || student.branch
                      : null;
                    const subject = isObject
                      ? student.subject_name || student.subject
                      : null;
                    const semester = isObject ? student.semester : null;

                    return (
                      <div
                        key={idx}
                        className="bg-yellow-100 border border-yellow-300 text-yellow-900 px-3 py-2 rounded-md"
                      >
                        <div className="font-semibold">{rollNo}</div>
                        {isObject && (
                          <>
                            {name && name !== rollNo && (
                              <div className="text-xs text-yellow-700 mt-0.5">
                                {name}
                              </div>
                            )}
                            <div className="flex flex-wrap gap-1 mt-1">
                              {branch && (
                                <span className="inline-block px-1.5 py-0.5 bg-yellow-200 rounded text-xs">
                                  {branch}
                                </span>
                              )}
                              {subject && (
                                <span className="inline-block px-1.5 py-0.5 bg-yellow-200 rounded text-xs">
                                  {subject}
                                </span>
                              )}
                              {semester && (
                                <span className="inline-block px-1.5 py-0.5 bg-yellow-200 rounded text-xs">
                                  Sem {semester}
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <Button onClick={onClose} variant="secondary" className="w-full">
          Close
        </Button>
      </div>
    </DialogContent>
  );
}
