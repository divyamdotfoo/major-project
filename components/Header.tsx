"use client";

export default function Header({ title, description }: { title: string; description?: string }) {
  return (
    <div className="mb-8 border-b border-gray-200 bg-white px-8 py-6">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      {description && (
        <p className="mt-1 text-sm text-gray-500">{description}</p>
      )}
    </div>
  );
}

