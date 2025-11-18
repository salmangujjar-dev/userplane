.PHONY: help install dev build clean lint format typecheck test
.DEFAULT_GOAL := help

# Colors
CYAN := \033[0;36m
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
MAGENTA := \033[0;35m
WHITE := \033[1;37m
RESET := \033[0m

help: ## Show this help message
	@echo "$(CYAN)"
	@echo "╔══════════════════════════════════════════════════════════════════════╗"
	@echo "║                                                                      ║"
	@echo "║         ▗▖ ▗▖ ▗▄▄▖▗▄▄▄▖▗▄▄▖ ▗▄▄▖ ▗▖    ▗▄▖ ▗▖  ▗▖▗▄▄▄▖               ║"
	@echo "║         ▐▌ ▐▌▐▌   ▐▌   ▐▌ ▐▌▐▌ ▐▌▐▌   ▐▌ ▐▌▐▛▚▖▐▌▐▌                  ║"
	@echo "║         ▐▌ ▐▌ ▝▀▚▖▐▛▀▀▘▐▛▀▚▖▐▛▀▘ ▐▌   ▐▛▀▜▌▐▌ ▝▜▌▐▛▀▀▘               ║"
	@echo "║         ▝▚▄▞▘▗▄▄▞▘▐▙▄▄▖▐▌ ▐▌▐▌   ▐▙▄▄▖▐▌ ▐▌▐▌  ▐▌▐▙▄▄▖               ║"
	@echo "║                                                                      ║"
	@echo "║                                                                      ║"
	@echo "╚══════════════════════════════════════════════════════════════════════╝"
	@echo "$(RESET)"
	@echo ""
	@echo "$(WHITE)╔═══════════════════════════════════════════════════════════════════════════════════════════════════╗$(RESET)"
	@echo "$(WHITE)║                                   Available Commands                                              ║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╦═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ Command                       ║ Description                                                       ║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╩═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(CYAN)SETUP$(WHITE)                                                                                             ║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╦═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(GREEN)install$(WHITE)                       ║$(RESET) Install all dependencies                                          $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)update$(WHITE)                        ║$(RESET) Update dependencies                                               $(WHITE)║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╩═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(CYAN)DEVELOPMENT$(WHITE)                                                                                       ║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╦═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(GREEN)dev$(WHITE)                           ║$(RESET) Run all apps in dev mode                                          $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)dev-web$(WHITE)                       ║$(RESET) Run web app only                                                  $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)dev-astro$(WHITE)                     ║$(RESET) Run astro app only                                                $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)dev-api$(WHITE)                       ║$(RESET) Run API only                                                      $(WHITE)║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╩═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(CYAN)BUILD$(WHITE)                                                                                             ║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╦═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(GREEN)build$(WHITE)                         ║$(RESET) Build all apps                                                    $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)build-web$(WHITE)                     ║$(RESET) Build web app only                                                $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)build-astro$(WHITE)                   ║$(RESET) Build astro app only                                              $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)build-api$(WHITE)                     ║$(RESET) Build API only                                                    $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)preview-astro$(WHITE)                 ║$(RESET) Preview astro production build                                    $(WHITE)║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╩═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(CYAN)CODE QUALITY$(WHITE)                                                                                      ║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╦═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(GREEN)lint$(WHITE)                          ║$(RESET) Run linter                                                        $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)lint-fix$(WHITE)                      ║$(RESET) Run linter and fix issues                                         $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)format$(WHITE)                        ║$(RESET) Format all files                                                  $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)format-check$(WHITE)                  ║$(RESET) Check formatting                                                  $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)typecheck$(WHITE)                     ║$(RESET) Type check all packages                                           $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)check$(WHITE)                         ║$(RESET) Run all (lint + type + format)                                    $(WHITE)║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╩═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(CYAN)TESTING$(WHITE)                                                                                           ║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╦═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(GREEN)test$(WHITE)                          ║$(RESET) Run all tests                                                     $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)test-watch$(WHITE)                    ║$(RESET) Run tests in watch mode                                           $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)test-api$(WHITE)                      ║$(RESET) Test API endpoints                                                $(WHITE)║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╩═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(CYAN)MAINTENANCE$(WHITE)                                                                                       ≠║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╦═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(GREEN)clean$(WHITE)                         ║$(RESET) Remove build outputs and caches                                   $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)clean-all$(WHITE)                     ║$(RESET) Remove deps, builds, and caches                                   $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)reset$(WHITE)                         ║$(RESET) Clean and reinstall everything                                    $(WHITE)║$(RESET)"
	@echo "$(WHITE)╚═══════════════════════════════╩═══════════════════════════════════════════════════════════════════╝$(RESET)"
	@echo ""
	@echo "$(YELLOW)Quick Shortcuts:$(RESET) $(CYAN)i$(RESET)=install $(CYAN)d$(RESET)=dev $(CYAN)b$(RESET)=build $(CYAN)l$(RESET)=lint $(CYAN)f$(RESET)=format $(CYAN)t$(RESET)=test $(CYAN)c$(RESET)=check"
	@echo ""

install: ## Install all dependencies
	@echo "$(BLUE)Installing dependencies...$(RESET)"
	@bun install
	@echo "$(GREEN)Dependencies installed!$(RESET)"

dev: ## Run all apps in dev mode
	@echo "$(MAGENTA)Starting all apps in development mode...$(RESET)"
	@bun dev

dev-web: ## Run web app only
	@echo "$(MAGENTA)Starting web app (Next.js)...$(RESET)"
	@cd apps/web && bun dev

dev-astro: ## Run astro app only
	@echo "$(MAGENTA)Starting Astro app...$(RESET)"
	@cd apps/astro-app && bun dev

dev-api: ## Run API only
	@echo "$(MAGENTA)Starting Hono API...$(RESET)"
	@cd apps/api && bun dev

build: ## Build all apps
	@echo "$(BLUE)Building all apps...$(RESET)"
	@bun run build
	@echo "$(GREEN)Build complete!$(RESET)"

build-web: ## Build web app only
	@echo "$(BLUE)Building web app...$(RESET)"
	@cd apps/web && bun run build
	@echo "$(GREEN)Web app built!$(RESET)"

build-astro: ## Build astro app only
	@echo "$(BLUE)Building Astro app...$(RESET)"
	@cd apps/astro-app && bun run build
	@echo "$(GREEN)Astro app built!$(RESET)"

build-api: ## Build API only
	@echo "$(BLUE)Building API...$(RESET)"
	@cd apps/api && bun run build
	@echo "$(GREEN)API built!$(RESET)"

lint: ## Run linter
	@echo "$(YELLOW)Running linter...$(RESET)"
	@bun run lint
	@echo "$(GREEN)Linting complete!$(RESET)"

lint-fix: ## Run linter and fix issues
	@echo "$(YELLOW)Running linter with auto-fix...$(RESET)"
	@bunx turbo lint -- --fix
	@echo "$(GREEN)Linting and fixes complete!$(RESET)"

format: ## Format all files
	@echo "$(YELLOW)Formatting code...$(RESET)"
	@bun run format
	@echo "$(GREEN)Formatting complete!$(RESET)"

format-check: ## Check formatting
	@echo "$(YELLOW)Checking code formatting...$(RESET)"
	@bun run format:check

typecheck: ## Type check all packages
	@echo "$(BLUE)Running type check...$(RESET)"
	@bunx turbo typecheck
	@echo "$(GREEN)Type check complete!$(RESET)"

test: ## Run all tests
	@echo "$(CYAN)Running tests...$(RESET)"
	@bunx turbo test
	@echo "$(GREEN)Tests complete!$(RESET)"

test-watch: ## Run tests in watch mode
	@echo "$(CYAN)Running tests in watch mode...$(RESET)"
	@bunx turbo test -- --watch

check: lint typecheck format-check ## Run all checks
	@echo "$(GREEN)All checks passed!$(RESET)"

clean: ## Remove build outputs and caches
	@echo "$(YELLOW)Cleaning build outputs and caches...$(RESET)"
	@rm -rf .turbo
	@find . -name 'dist' -type d -prune -exec rm -rf '{}' +
	@find . -name '.next' -type d -prune -exec rm -rf '{}' +
	@find . -name '.astro' -type d -prune -exec rm -rf '{}' +
	@echo "$(GREEN)Clean complete!$(RESET)"

clean-all: clean ## Remove deps, builds, and caches
	@echo "$(RED)Removing all dependencies...$(RESET)"
	@find . -name 'node_modules' -type d -prune -exec rm -rf '{}' +
	@rm -f bun.lockb
	@echo "$(GREEN)Everything cleaned!$(RESET)"

reset: clean-all install ## Clean and reinstall everything
	@echo "$(GREEN)Project reset complete!$(RESET)"

preview-astro: ## Preview astro production build
	@echo "$(MAGENTA)Previewing Astro production build...$(RESET)"
	@cd apps/astro-app && bun run preview

test-api: ## Test API endpoints
	@echo "$(CYAN)Testing API endpoints...$(RESET)"
	@cd apps/api && ./test-api.sh

update: ## Update dependencies
	@echo "$(BLUE)Updating dependencies...$(RESET)"
	@bun update
	@echo "$(GREEN)Dependencies updated!$(RESET)"

i: install ## Shortcut for install
d: dev ## Shortcut for dev
b: build ## Shortcut for build
l: lint ## Shortcut for lint
f: format ## Shortcut for format
t: test ## Shortcut for test
c: check ## Shortcut for check
