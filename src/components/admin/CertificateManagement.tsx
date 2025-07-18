import React, { useState } from 'react';
import { Award, Eye, Search, Filter, Calendar, User } from 'lucide-react';
import { mockCertificates, mockCourses, mockUsers } from '../../data/mockData';

const CertificateManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All');
  const [selectedMonth, setSelectedMonth] = useState<string>('All');
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [selectedCertificate, setSelectedCertificate] = useState<string | null>(null);

  const certificatesWithDetails = mockCertificates.map(cert => {
    const course = mockCourses.find(c => c.id === cert.courseId);
    const user = mockUsers.find(u => u.id === cert.userId);
    return { ...cert, course, user };
  });

  const filteredCertificates = certificatesWithDetails.filter(cert => {
    const matchesSearch = cert.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         cert.course?.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = selectedDepartment === 'All' || cert.user?.department === selectedDepartment;
    
    const certDate = new Date(cert.issuedAt);
    const matchesMonth = selectedMonth === 'All' || (certDate.getMonth() + 1).toString() === selectedMonth;
    const matchesYear = selectedYear === 'All' || certDate.getFullYear().toString() === selectedYear;
    
    return matchesSearch && matchesDepartment && matchesMonth && matchesYear;
  });

  const departments = ['All', 'HR', 'Operations', 'Sales', 'Engineering', 'Finance', 'Marketing'];
  const months = [
    { value: 'All', label: 'Todos os Meses' },
    { value: '1', label: 'Janeiro' },
    { value: '2', label: 'Fevereiro' },
    { value: '3', label: 'Março' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Maio' },
    { value: '6', label: 'Junho' },
    { value: '7', label: 'Julho' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Setembro' },
    { value: '10', label: 'Outubro' },
    { value: '11', label: 'Novembro' },
    { value: '12', label: 'Dezembro' }
  ];

  const years = ['All', '2024', '2023', '2022', '2021'];

  const handleViewCertificate = (certificateId: string) => {
    setSelectedCertificate(certificateId);
  };

  const selectedCert = certificatesWithDetails.find(cert => cert.id === selectedCertificate);

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Certificados Emitidos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Visualize todos os certificados emitidos pelos colaboradores
          </p>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por colaborador ou curso..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept === 'All' ? 'Todos os Departamentos' : dept}
              </option>
            ))}
          </select>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {months.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year === 'All' ? 'Todos os Anos' : year}
              </option>
            ))}
          </select>
        </div>

        {/* Certificates Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Colaborador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Curso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Departamento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Data de Emissão
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredCertificates.map((certificate) => (
                  <tr key={certificate.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {certificate.user?.avatar ? (
                          <img
                            src={certificate.user.avatar}
                            alt={certificate.user.name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-white" />
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {certificate.user?.name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {certificate.user?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {certificate.course?.title}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {certificate.course?.type}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                        {certificate.user?.department}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(certificate.issuedAt).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewCertificate(certificate.id)}
                        className="p-2 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Visualizar certificado"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total de Certificados
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {filteredCertificates.length}
                </p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                <Award className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Este Mês
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {filteredCertificates.filter(c => 
                    new Date(c.issuedAt).getMonth() === new Date().getMonth() &&
                    new Date(c.issuedAt).getFullYear() === new Date().getFullYear()
                  ).length}
                </p>
              </div>
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Colaboradores Certificados
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {new Set(filteredCertificates.map(c => c.userId)).size}
                </p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg">
                <User className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {filteredCertificates.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Award className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Nenhum certificado encontrado
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Tente ajustar os filtros de busca
            </p>
          </div>
        )}
      </div>

      {/* Certificate Viewer Modal */}
      {selectedCertificate && selectedCert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Visualizar Certificado
                </h3>
                <button
                  onClick={() => setSelectedCertificate(null)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  ×
                </button>
              </div>

              {/* Certificate Preview */}
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-8 text-white rounded-lg mb-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 transform translate-x-16 -translate-y-16">
                  <div className="w-full h-full bg-white/10 rounded-full"></div>
                </div>
                <div className="absolute bottom-0 left-0 w-24 h-24 transform -translate-x-12 translate-y-12">
                  <div className="w-full h-full bg-white/10 rounded-full"></div>
                </div>
                
                <div className="relative z-10 text-center">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 inline-flex mb-6">
                    <Award className="h-12 w-12" />
                  </div>
                  
                  <h2 className="text-3xl font-bold mb-4">
                    Certificado de Conclusão
                  </h2>
                  
                  <p className="text-xl mb-2">
                    Certificamos que
                  </p>
                  
                  <h3 className="text-2xl font-bold mb-4 text-yellow-200">
                    {selectedCert.user?.name}
                  </h3>
                  
                  <p className="text-lg mb-2">
                    concluiu com êxito o curso
                  </p>
                  
                  <h4 className="text-xl font-semibold mb-6">
                    {selectedCert.course?.title}
                  </h4>
                  
                  <div className="flex justify-between items-end text-sm">
                    <div>
                      <p>Universidade Interlub</p>
                      <p>Interlub Group</p>
                    </div>
                    <div className="text-right">
                      <p>Emitido em</p>
                      <p>{new Date(selectedCert.issuedAt).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CertificateManagement;