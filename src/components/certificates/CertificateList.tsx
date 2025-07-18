import React, { useState } from 'react';
import { Award, Download, Eye, Calendar, Share2, X } from 'lucide-react';
import { mockCertificates, mockCourses } from '../../data/mockData';
import { useAuth } from '../../contexts/AuthContext';

const CertificateList: React.FC = () => {
  const { user } = useAuth();
  const [selectedCertificate, setSelectedCertificate] = useState<string | null>(null);

  const userCertificates = mockCertificates
    .filter(cert => cert.userId === user?.id)
    .map(cert => ({
      ...cert,
      course: mockCourses.find(course => course.id === cert.courseId)
    }));

  const handleDownload = (certificateId: string) => {
    try {
      // Create a simple PDF-like content
      const certificateData = userCertificates.find(c => c.id === certificateId);
      if (!certificateData) return;

      // Create a blob with certificate content
      const content = `
CERTIFICADO DE CONCLUSÃO

Certificamos que ${user?.name} concluiu com êxito o curso:
${certificateData.course?.title}

Emitido em: ${new Date(certificateData.issuedAt).toLocaleDateString('pt-BR')}
Universidade Interlub - Interlub Group
      `;

      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `certificado-${certificateData.course?.title.replace(/\s+/g, '-').toLowerCase()}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao baixar certificado:', error);
      alert('Erro ao baixar o certificado. Tente novamente.');
    }
  };

  const handleView = (certificateId: string) => {
    setSelectedCertificate(certificateId);
  };

  const handleShare = (certificateId: string) => {
    const certificateUrl = `https://universidade.interlub.com/certificados/${certificateId}`;
    
    if (navigator.share) {
      navigator.share({
        title: 'Meu Certificado - Universidade Interlub',
        text: 'Confira meu certificado da Universidade Interlub!',
        url: certificateUrl
      });
    } else {
      navigator.clipboard.writeText(certificateUrl).then(() => {
        alert('Link do certificado copiado para a área de transferência!');
      }).catch(() => {
        alert('Não foi possível copiar o link. Tente novamente.');
      });
    }
  };

  const selectedCert = userCertificates.find(cert => cert.id === selectedCertificate);

  if (userCertificates.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="bg-gray-100 dark:bg-gray-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
            <Award className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Nenhum certificado ainda
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Complete cursos para ganhar certificados digitais
          </p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors">
            Explorar cursos
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Meus Certificados
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {userCertificates.length} certificado{userCertificates.length !== 1 ? 's' : ''} conquista{userCertificates.length !== 1 ? 'dos' : 'do'}
            </p>
          </div>
        </div>

        {/* Certificates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {userCertificates.map((certificate) => (
            <div
              key={certificate.id}
              className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
            >
              {/* Certificate preview */}
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 transform translate-x-10 -translate-y-10">
                  <div className="w-full h-full bg-white/10 rounded-full"></div>
                </div>
                <div className="absolute bottom-0 left-0 w-16 h-16 transform -translate-x-8 translate-y-8">
                  <div className="w-full h-full bg-white/10 rounded-full"></div>
                </div>
                
                <div className="relative z-10">
                  <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 inline-flex mb-4">
                    <Award className="h-6 w-6" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 line-clamp-2">
                    Certificado de Conclusão
                  </h3>
                  <p className="text-blue-100 text-sm">
                    {certificate.course?.title}
                  </p>
                </div>
              </div>

              {/* Certificate details */}
              <div className="p-4">
                <div className="flex items-center text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <Calendar className="h-4 w-4 mr-1" />
                  Emitido em {new Date(certificate.issuedAt).toLocaleDateString('pt-BR')}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleView(certificate.id)}
                    className="flex-1 flex items-center justify-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Visualizar
                  </button>
                  <button
                    onClick={() => handleDownload(certificate.id)}
                    className="flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm transition-colors"
                    title="Baixar certificado"
                  >
                    <Download className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleShare(certificate.id)}
                    className="flex items-center justify-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm transition-colors"
                    title="Compartilhar certificado"
                  >
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 mt-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Conquistas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-3 inline-flex mb-2">
                <Award className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {userCertificates.length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Certificados
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 dark:bg-green-900 rounded-full p-3 inline-flex mb-2">
                <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {new Date().getFullYear()}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Último ano
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 dark:bg-purple-900 rounded-full p-3 inline-flex mb-2">
                <Share2 className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                100%
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Válidos
              </p>
            </div>
          </div>
        </div>
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
                  <X className="h-5 w-5" />
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
                    {user?.name}
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

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={() => handleDownload(selectedCert.id)}
                  className="flex-1 flex items-center justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar Certificado
                </button>
                <button
                  onClick={() => handleShare(selectedCert.id)}
                  className="flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Share2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CertificateList;