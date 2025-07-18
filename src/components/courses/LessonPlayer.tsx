import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  CheckCircle,
  FileText,
  Video,
  HelpCircle,
  Download
} from 'lucide-react';
import { Course, Lesson } from '../../types';

interface LessonPlayerProps {
  course: Course;
  lesson: Lesson;
  onBack: () => void;
  onComplete: () => void;
  onNext: () => void;
  onPrevious: () => void;
  hasNext: boolean;
  hasPrevious: boolean;
}

const LessonPlayer: React.FC<LessonPlayerProps> = ({
  course,
  lesson,
  onBack,
  onComplete,
  onNext,
  onPrevious,
  hasNext,
  hasPrevious
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string | number>>({});
  const [quizCompleted, setQuizCompleted] = useState(false);

  const handleQuizSubmit = () => {
    // Simple quiz validation - in real app, would validate against correct answers
    setQuizCompleted(true);
    onComplete();
  };

  const renderLessonContent = () => {
    switch (lesson.type) {
      case 'video':
        return (
          <div className="bg-black rounded-lg overflow-hidden">
            <div className="aspect-video flex items-center justify-center bg-gray-900">
              <div className="text-center text-white">
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 inline-flex mb-4">
                  <Video className="h-8 w-8" />
                </div>
                <p className="text-lg font-medium mb-2">Vídeo: {lesson.title}</p>
                <p className="text-gray-300 mb-4">Duração: {lesson.duration} minutos</p>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg flex items-center mx-auto transition-colors"
                >
                  {isPlaying ? (
                    <>
                      <Pause className="h-5 w-5 mr-2" />
                      Pausar
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 mr-2" />
                      Reproduzir
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        );

      case 'document':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700">
            <div className="text-center mb-6">
              <div className="bg-blue-100 dark:bg-blue-900 rounded-full p-4 inline-flex mb-4">
                <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {lesson.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {lesson.description}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 mb-6">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                Conteúdo do documento
              </h4>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Este é um exemplo de conteúdo de documento. Em uma implementação real, 
                  o conteúdo seria carregado dinamicamente a partir do URL fornecido no 
                  campo 'content' da lição.
                </p>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  O documento pode conter informações importantes sobre {lesson.title.toLowerCase()}, 
                  incluindo conceitos teóricos, exemplos práticos e orientações específicas 
                  relacionadas ao curso {course.title}.
                </p>
              </div>
            </div>

            <div className="flex justify-center">
              <button className="flex items-center px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                <Download className="h-4 w-4 mr-2" />
                Baixar documento
              </button>
            </div>
          </div>
        );

      case 'quiz':
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700">
            <div className="text-center mb-6">
              <div className="bg-purple-100 dark:bg-purple-900 rounded-full p-4 inline-flex mb-4">
                <HelpCircle className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {lesson.title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {lesson.description}
              </p>
            </div>

            {!showQuiz && !quizCompleted && (
              <div className="text-center">
                <button
                  onClick={() => setShowQuiz(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Iniciar Quiz
                </button>
              </div>
            )}

            {showQuiz && !quizCompleted && lesson.quiz && (
              <div className="space-y-6">
                {lesson.quiz.questions.map((question, index) => (
                  <div key={question.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                      {index + 1}. {question.text}
                    </h4>
                    
                    {question.type === 'multiple-choice' && question.options && (
                      <div className="space-y-2">
                        {question.options.map((option, optionIndex) => (
                          <label key={optionIndex} className="flex items-center">
                            <input
                              type="radio"
                              name={question.id}
                              value={optionIndex}
                              onChange={(e) => setQuizAnswers({
                                ...quizAnswers,
                                [question.id]: parseInt(e.target.value)
                              })}
                              className="mr-3"
                            />
                            <span className="text-gray-700 dark:text-gray-300">
                              {option}
                            </span>
                          </label>
                        ))}
                      </div>
                    )}

                    {question.type === 'true-false' && (
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={question.id}
                            value="true"
                            onChange={(e) => setQuizAnswers({
                              ...quizAnswers,
                              [question.id]: e.target.value
                            })}
                            className="mr-3"
                          />
                          <span className="text-gray-700 dark:text-gray-300">Verdadeiro</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name={question.id}
                            value="false"
                            onChange={(e) => setQuizAnswers({
                              ...quizAnswers,
                              [question.id]: e.target.value
                            })}
                            className="mr-3"
                          />
                          <span className="text-gray-700 dark:text-gray-300">Falso</span>
                        </label>
                      </div>
                    )}

                    {question.type === 'text' && (
                      <input
                        type="text"
                        onChange={(e) => setQuizAnswers({
                          ...quizAnswers,
                          [question.id]: e.target.value
                        })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Digite sua resposta..."
                      />
                    )}
                  </div>
                ))}

                <div className="text-center">
                  <button
                    onClick={handleQuizSubmit}
                    disabled={Object.keys(quizAnswers).length < (lesson.quiz?.questions.length || 0)}
                    className="bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg transition-colors disabled:cursor-not-allowed"
                  >
                    Enviar Respostas
                  </button>
                </div>
              </div>
            )}

            {quizCompleted && (
              <div className="text-center">
                <div className="bg-green-100 dark:bg-green-900 rounded-full p-4 inline-flex mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Quiz Concluído!
                </h4>
                <p className="text-gray-600 dark:text-gray-400">
                  Parabéns! Você completou o quiz com sucesso.
                </p>
              </div>
            )}
          </div>
        );

      default:
        return (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 border border-gray-200 dark:border-gray-700 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              Tipo de conteúdo não suportado: {lesson.type}
            </p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                {lesson.title}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {course.title}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={onPrevious}
              disabled={!hasPrevious}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SkipBack className="h-5 w-5" />
            </button>
            <button
              onClick={onNext}
              disabled={!hasNext}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SkipForward className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto p-6">
        {renderLessonContent()}

        {/* Action buttons */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onPrevious}
            disabled={!hasPrevious}
            className="flex items-center px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <SkipBack className="h-4 w-4 mr-2" />
            Anterior
          </button>

          <div className="flex space-x-3">
            {lesson.type !== 'quiz' && (
              <button
                onClick={onComplete}
                className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Marcar como concluído
              </button>
            )}
            
            <button
              onClick={onNext}
              disabled={!hasNext}
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Próximo
              <SkipForward className="h-4 w-4 ml-2" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LessonPlayer;