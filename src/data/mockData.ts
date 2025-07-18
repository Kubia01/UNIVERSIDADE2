import { User, Course, UserProgress, Certificate, CourseAssignment, AdminNotification } from '../types';

export const mockUsers: User[] = [
  {
    id: '1',
    name: 'Maria Silva',
    email: 'maria.silva@interlub.com',
    department: 'HR',
    role: 'admin',
    avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    joinedAt: '2024-01-15T09:00:00Z',
    lastLogin: '2024-12-20T14:30:00Z'
  },
  {
    id: '2',
    name: 'João Santos',
    email: 'joao.santos@interlub.com',
    department: 'Operations',
    role: 'manager',
    avatar: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    joinedAt: '2024-02-01T09:00:00Z',
    lastLogin: '2024-12-20T10:15:00Z'
  },
  {
    id: '3',
    name: 'Ana Costa',
    email: 'ana.costa@interlub.com',
    department: 'Sales',
    role: 'student',
    avatar: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    joinedAt: '2024-03-10T09:00:00Z',
    lastLogin: '2024-12-19T16:45:00Z'
  },
  {
    id: '4',
    name: 'Carlos Ferreira',
    email: 'carlos.ferreira@interlub.com',
    department: 'Sales',
    role: 'student',
    avatar: 'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2',
    joinedAt: '2024-04-05T09:00:00Z',
    lastLogin: '2024-12-18T11:20:00Z'
  }
];

export const mockCourses: Course[] = [
  {
    id: '1',
    title: 'Onboarding Interlub - Bem-vindos',
    description: 'Curso introdutório para novos colaboradores conhecerem a cultura, valores e processos da Interlub Group.',
    department: 'HR',
    type: 'onboarding',
    duration: 120,
    instructor: 'Maria Silva',
    thumbnail: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=400',
    lessons: [
      {
        id: '1-1',
        title: 'História e Valores da Interlub',
        description: 'Conheça nossa trajetória e princípios',
        type: 'video',
        content: 'https://example.com/video1',
        duration: 30
      },
      {
        id: '1-2',
        title: 'Estrutura Organizacional',
        description: 'Entenda como nossa empresa está organizada',
        type: 'document',
        content: 'https://example.com/doc1',
        duration: 20
      },
      {
        id: '1-3',
        title: 'Quiz - Conhecendo a Interlub',
        description: 'Teste seus conhecimentos',
        type: 'quiz',
        content: '',
        duration: 15,
        quiz: {
          id: 'q1',
          title: 'Quiz - Conhecendo a Interlub',
          questions: [
            {
              id: 'q1-1',
              text: 'Em que ano foi fundada a Interlub Group?',
              type: 'multiple-choice',
              options: ['2010', '2015', '2018', '2020'],
              correctAnswer: 1
            }
          ]
        }
      }
    ],
    isPublished: true,
    isMandatory: true,
    deadline: '2025-01-31T23:59:59Z',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-12-01T00:00:00Z'
  },
  {
    id: '2',
    title: 'Segurança no Trabalho',
    description: 'Treinamento obrigatório sobre normas de segurança e prevenção de acidentes no ambiente de trabalho.',
    department: 'Operations',
    type: 'compliance',
    duration: 90,
    instructor: 'João Santos',
    thumbnail: 'https://images.pexels.com/photos/4481323/pexels-photo-4481323.jpeg?auto=compress&cs=tinysrgb&w=400',
    lessons: [
      {
        id: '2-1',
        title: 'Normas de Segurança',
        description: 'Regulamentações e procedimentos',
        type: 'video',
        content: 'https://example.com/video2',
        duration: 45
      },
      {
        id: '2-2',
        title: 'Equipamentos de Proteção',
        description: 'Uso correto dos EPIs',
        type: 'video',
        content: 'https://example.com/video3',
        duration: 30
      },
      {
        id: '2-3',
        title: 'Avaliação Final',
        description: 'Teste de conhecimentos sobre segurança',
        type: 'quiz',
        content: '',
        duration: 15
      }
    ],
    isPublished: true,
    isMandatory: true,
    deadline: '2025-02-28T23:59:59Z',
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-12-05T00:00:00Z'
  },
  {
    id: '3',
    title: 'Técnicas de Vendas Avançadas',
    description: 'Desenvolva suas habilidades de vendas com técnicas modernas e estratégias de negociação.',
    department: 'Sales',
    type: 'skills',
    duration: 180,
    instructor: 'Carlos Ferreira',
    thumbnail: 'https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=400',
    lessons: [
      {
        id: '3-1',
        title: 'Psicologia do Cliente',
        description: 'Entendendo o comportamento do consumidor',
        type: 'video',
        content: 'https://example.com/video4',
        duration: 60
      },
      {
        id: '3-2',
        title: 'Técnicas de Negociação',
        description: 'Estratégias para fechar vendas',
        type: 'video',
        content: 'https://example.com/video5',
        duration: 90
      },
      {
        id: '3-3',
        title: 'Casos Práticos',
        description: 'Simulações de vendas reais',
        type: 'interactive',
        content: 'https://example.com/simulation1',
        duration: 30
      }
    ],
    isPublished: true,
    isMandatory: false,
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-12-10T00:00:00Z'
  },
  {
    id: '4',
    title: 'Liderança e Gestão de Equipes',
    description: 'Desenvolva competências de liderança e aprenda a gerenciar equipes de alta performance.',
    department: 'HR',
    type: 'leadership',
    duration: 240,
    instructor: 'Patricia Lima',
    thumbnail: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=400',
    lessons: [
      {
        id: '4-1',
        title: 'Fundamentos da Liderança',
        description: 'O que faz um bom líder',
        type: 'video',
        content: 'https://example.com/video6',
        duration: 80
      },
      {
        id: '4-2',
        title: 'Comunicação Eficaz',
        description: 'Como se comunicar com sua equipe',
        type: 'video',
        content: 'https://example.com/video7',
        duration: 70
      },
      {
        id: '4-3',
        title: 'Gestão de Conflitos',
        description: 'Resolvendo problemas na equipe',
        type: 'video',
        content: 'https://example.com/video8',
        duration: 60
      },
      {
        id: '4-4',
        title: 'Projeto Final',
        description: 'Plano de desenvolvimento da equipe',
        type: 'interactive',
        content: 'https://example.com/project1',
        duration: 30
      }
    ],
    isPublished: true,
    isMandatory: false,
    createdAt: '2024-03-01T00:00:00Z',
    updatedAt: '2024-12-15T00:00:00Z'
  }
];

export const mockProgress: UserProgress[] = [
  {
    userId: '3',
    courseId: '1',
    progress: 67,
    completedLessons: ['1-1', '1-2'],
    startedAt: '2024-12-01T09:00:00Z'
  },
  {
    userId: '3',
    courseId: '3',
    progress: 100,
    completedLessons: ['3-1', '3-2', '3-3'],
    startedAt: '2024-11-15T09:00:00Z',
    completedAt: '2024-12-10T15:30:00Z',
    certificateId: 'cert-1'
  }
];

export const mockCertificates: Certificate[] = [
  {
    id: 'cert-1',
    userId: '3',
    courseId: '3',
    issuedAt: '2024-12-10T15:30:00Z',
    certificateUrl: 'https://example.com/certificates/cert-1.pdf'
  }
];

export const mockCourseAssignments: CourseAssignment[] = [
  {
    id: 'assign-1',
    userId: '3',
    courseId: '1',
    assignedBy: '1',
    assignedAt: '2024-12-01T09:00:00Z',
    deadline: '2025-01-31T23:59:59Z'
  },
  {
    id: 'assign-2',
    userId: '3',
    courseId: '3',
    assignedBy: '1',
    assignedAt: '2024-11-15T09:00:00Z'
  }
];

export const mockAdminNotifications: AdminNotification[] = [
  {
    id: '1',
    title: 'Bem-vindos à Universidade Interlub',
    message: 'Seja bem-vindo à nossa plataforma de ensino corporativo! Aqui você encontrará todos os cursos necessários para seu desenvolvimento profissional. Explore os conteúdos disponíveis e mantenha-se sempre atualizado.',
    type: 'welcome',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-12-01T00:00:00Z'
  },
  {
    id: '2',
    title: 'Política de Privacidade',
    message: 'Respeitamos sua privacidade e protegemos seus dados pessoais. Todos os dados coletados são utilizados exclusivamente para fins educacionais e de desenvolvimento profissional. Para mais informações, consulte nossa política completa de privacidade.',
    type: 'policy',
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-12-01T00:00:00Z'
  },
  {
    id: '3',
    title: 'Comunicado Importante',
    message: 'Lembre-se de completar todos os cursos obrigatórios dentro dos prazos estabelecidos. Em caso de dúvidas, entre em contato com o departamento de RH. Seu desenvolvimento é nossa prioridade!',
    type: 'announcement',
    isActive: true,
    createdAt: '2024-12-01T00:00:00Z',
    updatedAt: '2024-12-01T00:00:00Z'
  }
];