// Từ điển Việt hóa cho toàn bộ ứng dụng
export const VIETNAMESE_TEXT = {
  // Navigation
  nav: {
    home: 'Trang chủ',
    diagnostic: 'Chẩn đoán',
    analysis: 'Phân tích',
    learningPath: 'Lộ trình học',
    exercises: 'Bài tập',
    progress: 'Tiến độ',
    profile: 'Hồ sơ',
    login: 'Đăng nhập',
    logout: 'Đăng xuất',
  },

  // Auth
  auth: {
    login: 'Đăng nhập',
    register: 'Đăng ký',
    email: 'Email',
    password: 'Mật khẩu',
    fullName: 'Họ và tên',
    welcomeBack: 'Chào mừng trở lại',
    createAccount: 'Tạo tài khoản mới',
    alreadyHaveAccount: 'Đã có tài khoản?',
    dontHaveAccount: 'Chưa có tài khoản?',
    loginNow: 'Đăng nhập ngay',
    registerNow: 'Đăng ký ngay',
    loggingIn: 'Đang đăng nhập...',
    registering: 'Đang đăng ký...',
  },

  // Common
  common: {
    loading: 'Đang tải...',
    error: 'Lỗi',
    success: 'Thành công',
    save: 'Lưu',
    cancel: 'Hủy',
    delete: 'Xóa',
    edit: 'Sửa',
    view: 'Xem',
    back: 'Quay lại',
    next: 'Tiếp theo',
    previous: 'Trước',
    submit: 'Gửi',
    confirm: 'Xác nhận',
    close: 'Đóng',
  },

  // Dashboard
  dashboard: {
    welcome: 'Xin chào',
    greeting: 'Chào mừng đến với AI Learning Coach!',
    totalSessions: 'Tổng buổi học',
    completedSessions: 'Đã hoàn thành',
    completionRate: 'Tỷ lệ hoàn thành',
    topicsmastered: 'Chủ đề vững',
    exercises: 'Bài tập',
    correctExercises: 'Bài tập đúng',
    accuracyRate: 'Tỷ lệ chính xác',
    needImprovement: 'Cần cải thiện',
  },

  // Analysis
  analysis: {
    title: 'Phân tích Năng lực',
    description: 'Đánh giá điểm mạnh, điểm yếu và lộ trình học tập cá nhân hóa',
    weakTopics: 'Chuyên đề yếu',
    averageTopics: 'Chuyên đề trung bình',
    strongTopics: 'Chuyên đề vững',
    overallAssessment: 'Đánh giá tổng quan',
    recommendations: 'Gợi ý học tập',
    priorityTopics: 'Chuyên đề ưu tiên',
    estimatedTime: 'Thời gian ước tính',
    weeks: 'tuần',
  },

  // Learning Path
  learningPath: {
    title: 'Lộ trình Học tập',
    description: 'Lộ trình học tập được cá nhân hóa bởi AI',
    generate: 'Tạo lộ trình học',
    generating: 'Đang tạo lộ trình...',
    noPath: 'Chưa có lộ trình học',
    createFirst: 'Hãy tạo lộ trình học để bắt đầu',
    phaseFoundation: 'Giai đoạn Nền tảng',
    phaseCore: 'Giai đoạn Trọng tâm',
    phaseReview: 'Giai đoạn Ôn tập',
    aiStrategy: 'Chiến lược từ AI',
  },

  // Progress
  progress: {
    title: 'Tiến độ Học tập',
    description: 'Theo dõi quá trình và kết quả học tập của bạn',
    overallProgress: 'Tiến độ tổng quan',
    completionRate: 'Hoàn thành buổi học',
    disciplineScore: 'Điểm kỷ luật',
    masteryRadar: 'Biểu đồ Radar Năng lực',
    noData: 'Chưa có dữ liệu',
    startLearning: 'Hãy bắt đầu học tập để xem tiến độ của bạn',
  },

  // Exercises
  exercises: {
    title: 'Bài tập AI',
    description: 'Luyện tập với bài tập được tạo bởi AI',
    generate: 'Tạo bài tập mới',
    generating: 'AI đang tạo bài tập...',
    selectChapter: 'Chọn chương',
    selectDifficulty: 'Chọn độ khó',
    easy: 'Dễ',
    medium: 'Trung bình',
    hard: 'Khó',
    submit: 'Nộp bài',
    showSolution: 'Xem lời giải',
    hideSolution: 'Ẩn lời giải',
    correct: 'Đúng',
    incorrect: 'Sai',
    yourAnswer: 'Câu trả lời của bạn',
    correctAnswer: 'Đáp án đúng',
  },

  // Diagnostic
  diagnostic: {
    title: 'Bài test Chẩn đoán',
    description: 'Đánh giá năng lực hiện tại của bạn',
    start: 'Bắt đầu',
    submit: 'Nộp bài',
    question: 'Câu hỏi',
    of: 'trên',
    timeRemaining: 'Thời gian còn lại',
    results: 'Kết quả',
    score: 'Điểm số',
    passed: 'Đạt',
    failed: 'Chưa đạt',
  },

  // Profile
  profile: {
    title: 'Hồ sơ cá nhân',
    personalInfo: 'Thông tin cá nhân',
    email: 'Email',
    fullName: 'Họ và tên',
    school: 'Trường',
    grade: 'Khối',
    goalScore: 'Mục tiêu điểm',
    save: 'Lưu thay đổi',
    saving: 'Đang lưu...',
    changePassword: 'Đổi mật khẩu',
    oldPassword: 'Mật khẩu cũ',
    newPassword: 'Mật khẩu mới',
    confirmPassword: 'Xác nhận mật khẩu',
  },

  // Admin
  admin: {
    title: 'Quản trị',
    dashboard: 'Dashboard',
    students: 'Học sinh',
    analytics: 'Phân tích',
    settings: 'Cài đặt',
    totalStudents: 'Tổng học sinh',
    activeStudents: 'Học sinh hoạt động',
    totalExercises: 'Tổng bài tập',
    averageScore: 'Điểm trung bình',
    viewDetails: 'Xem chi tiết',
    studentList: 'Danh sách học sinh',
    search: 'Tìm kiếm',
    export: 'Xuất dữ liệu',
  },

  // Messages
  messages: {
    loginSuccess: 'Đăng nhập thành công!',
    loginFailed: 'Đăng nhập thất bại. Vui lòng kiểm tra lại email và mật khẩu.',
    registerSuccess: 'Đăng ký thành công!',
    registerFailed: 'Đăng ký thất bại. Vui lòng thử lại.',
    saveSuccess: 'Đã lưu thành công!',
    saveFailed: 'Lưu thất bại. Vui lòng thử lại.',
    deleteConfirm: 'Bạn có chắc muốn xóa?',
    networkError: 'Lỗi kết nối mạng. Vui lòng thử lại.',
    noData: 'Không có dữ liệu',
    comingSoon: 'Tính năng sắp ra mắt',
  },

  // Chapters
  chapters: {
    1: 'Chương I: Mệnh đề và Tập hợp',
    2: 'Chương II: Bất phương trình',
    3: 'Chương III: Góc lượng giác và Hệ thức lượng',
    4: 'Chương IV: Vectơ',
    5: 'Chương V: Phương trình đường thẳng và đường tròn',
  },

  // Classifications
  classifications: {
    weak: 'Yếu',
    average: 'Trung bình',
    strong: 'Vững',
  },

  // Phases
  phases: {
    foundation: 'Nền tảng',
    core: 'Trọng tâm',
    review: 'Ôn tập',
  },
};

// Helper function to get text
export function t(key: string): string {
  const keys = key.split('.');
  let value: any = VIETNAMESE_TEXT;
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k];
    } else {
      return key; // Return key if not found
    }
  }
  
  return typeof value === 'string' ? value : key;
}

export default VIETNAMESE_TEXT;

