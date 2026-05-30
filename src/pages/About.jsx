import { useNavigate } from 'react-router-dom'

function About() {
  const navigate = useNavigate()

  const handleGoBack = () => {
    navigate(-1) // 返回上一页
  }

  const handleGoHome = () => {
    navigate('/') // 回到首页
  }

  return (
    <div className="page">
      <h2>📖 关于我们</h2>
      <p>这是一个演示 React Router 核心功能的示例项目</p>
      <div className="info-box">
        <h3>功能特性：</h3>
        <ul>
          <li>✅ 基础路由配置</li>
          <li>✅ 嵌套路由</li>
          <li>✅ 动态路由参数</li>
          <li>✅ 编程式导航</li>
          <li>✅ 404 页面处理</li>
          <li>✅ 导航栏高亮</li>
        </ul>
      </div>
      <div className="button-group">
        <button onClick={handleGoBack} className="btn">返回上一页</button>
        <button onClick={handleGoHome} className="btn btn-primary">回到首页</button>
      </div>
    </div>
  )
}

export default About