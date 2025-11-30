import { useEffect, useState } from 'react';
import { apiGet } from '../../utils/api';
import withAdminAuth from '../../utils/withAdminAuth';
import AdminLayout from '../../components/AdminLayout';
import Link from 'next/link';

type Student = {
  id: number;
  email: string;
  full_name: string | null;
  school: string | null;
  grade: string | null;
  created_at: string;
};

function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const limit = 20;

  useEffect(() => {
    loadStudents();
  }, [page, search]);

  const loadStudents = async () => {
    try {
      setLoading(true);
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
      const data = await apiGet(`/admin/students?skip=${page * limit}&limit=${limit}${searchParam}`);
      setStudents(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(0); // Reset to first page on search
  };

  return (
    <AdminLayout>
      <div className="max-w-7xl mx-auto animate-fade-in">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <span>👥</span>
            <span>Students Management</span>
          </h1>
          <p className="text-gray-600">View and manage all registered students</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="🔍 Search by email or name..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all"
              />
            </div>
            <button
              onClick={loadStudents}
              className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all"
            >
              Search
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <div className="text-6xl mb-4 animate-spin">⏳</div>
            <p className="text-gray-600">Loading students...</p>
          </div>
        ) : (
          <>
            {/* Students Table */}
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gradient-to-r from-orange-500 to-red-500 text-white">
                    <tr>
                      <th className="text-left p-4 font-semibold">ID</th>
                      <th className="text-left p-4 font-semibold">Email</th>
                      <th className="text-left p-4 font-semibold">Full Name</th>
                      <th className="text-left p-4 font-semibold">School</th>
                      <th className="text-left p-4 font-semibold">Grade</th>
                      <th className="text-left p-4 font-semibold">Registered</th>
                      <th className="text-left p-4 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.length > 0 ? (
                      students.map((student) => (
                        <tr
                          key={student.id}
                          className="border-b hover:bg-orange-50 transition-colors"
                        >
                          <td className="p-4 font-mono text-sm text-gray-600">{student.id}</td>
                          <td className="p-4">
                            <span className="font-medium text-gray-800">{student.email}</span>
                          </td>
                          <td className="p-4">
                            <span className="text-gray-700">{student.full_name || '-'}</span>
                          </td>
                          <td className="p-4 text-gray-600">{student.school || '-'}</td>
                          <td className="p-4 text-gray-600">{student.grade || '-'}</td>
                          <td className="p-4 text-gray-600 text-sm">
                            {new Date(student.created_at).toLocaleDateString('vi-VN')}
                          </td>
                          <td className="p-4">
                            <Link
                              href={`/admin/students/${student.id}`}
                              className="inline-flex items-center gap-1 px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all text-sm"
                            >
                              <span>👁️</span>
                              <span>View</span>
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="p-12 text-center">
                          <div className="text-6xl mb-4">🔍</div>
                          <p className="text-gray-500 text-lg">No students found</p>
                          {search && (
                            <p className="text-sm text-gray-400 mt-2">
                              Try a different search term
                            </p>
                          )}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {students.length > 0 && (
              <div className="mt-6 flex items-center justify-between bg-white rounded-xl shadow-lg p-4">
                <button
                  onClick={() => setPage(Math.max(0, page - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  ← Previous
                </button>
                <span className="text-gray-700 font-medium">
                  Page {page + 1}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={students.length < limit}
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-semibold hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}

export default withAdminAuth(StudentsPage);

