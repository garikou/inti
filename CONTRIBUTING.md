# Contributing to Inti

Thank you for your interest in contributing to Inti! This document provides guidelines and information for contributors.

## 🚀 Getting Started

1. **Fork the repository**
2. **Clone your fork**
   ```bash
   git clone https://github.com/your-username/inti.git
   cd inti
   ```
3. **Install dependencies**
   ```bash
   npm install
   ```
4. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```
5. **Start the development server**
   ```bash
   npm run dev
   ```

## 📝 Development Guidelines

### Code Style

- Use **TypeScript** for all new code
- Follow **ESLint** and **Prettier** configurations
- Use **conventional commits** for commit messages
- Write **JSDoc comments** for functions and classes

### Commit Message Format

```
type(scope): description

[optional body]

[optional footer]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(chat): add natural language swap parsing
fix(swap): resolve USD amount display issue
docs(readme): update installation instructions
```

### Pull Request Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, well-documented code
   - Add tests for new functionality
   - Update documentation if needed

3. **Test your changes**
   ```bash
   npm run test
   npm run lint
   npm run build
   ```

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Provide a clear description of your changes
   - Include any relevant issue numbers
   - Add screenshots for UI changes

## 🧪 Testing

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Writing Tests
- Write tests for all new functionality
- Use **React Testing Library** for component tests
- Use **Jest** for unit tests
- Aim for good test coverage

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Environment information**
   - Operating system
   - Node.js version
   - Browser version (if applicable)

2. **Steps to reproduce**
   - Clear, step-by-step instructions
   - Expected vs actual behavior

3. **Additional context**
   - Screenshots or videos
   - Console errors
   - Network tab information

## 💡 Feature Requests

When requesting features, please include:

1. **Problem description**
   - What problem does this feature solve?
   - Why is this feature needed?

2. **Proposed solution**
   - How should this feature work?
   - Any specific requirements?

3. **Additional context**
   - Use cases
   - Examples from other applications

## 📚 Documentation

When contributing documentation:

1. **Keep it clear and concise**
2. **Include code examples**
3. **Update related documentation**
4. **Test all code examples**

## 🔒 Security

If you discover a security vulnerability:

1. **Do not open a public issue**
2. **Email the maintainers directly**
3. **Provide detailed information**
4. **Allow time for response**

## 🎯 Areas for Contribution

### High Priority
- Bug fixes
- Performance improvements
- Security enhancements
- Documentation updates

### Medium Priority
- New features
- UI/UX improvements
- Test coverage
- Code refactoring

### Low Priority
- Minor UI tweaks
- Additional examples
- Blog posts
- Community support

## 🤝 Community

- **Discord**: [Join our community](https://discord.gg/your-server)
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-repo/discussions)

## 📄 License

By contributing to Inti, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Inti! 🚀
