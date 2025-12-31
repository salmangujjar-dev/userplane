.PHONY: help install dev dev\:web dev\:astro dev\:api dev\:share dev\:email build build\:web build\:astro build\:api build\:share lint lint\:fix format format\:check typecheck test test\:watch test\:api check clean clean\:all clean\:deep reset preview\:astro update env\:setup env\:check db\:generate db\:generate\:staging db\:generate\:production db\:migrate db\:migrate\:staging db\:migrate\:production db\:push db\:push\:staging db\:push\:production db\:studio db\:studio\:staging db\:studio\:production trigger\:login trigger\:whoami trigger\:dev trigger\:deploy trigger\:deploy\:staging trigger\:deploy\:production storybook\:recorder storybook\:recorder\:build i d b l f t c
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
	@echo "$(WHITE)║ $(GREEN)env:setup$(WHITE)                     ║$(RESET) Copy .env.example files to create .env files                      $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)env:check$(WHITE)                     ║$(RESET) Check if .env files exist                                         $(WHITE)║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╩═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(CYAN)DATABASE$(WHITE)                                                                                          ║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╦═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(GREEN)db:generate$(WHITE)                   ║$(RESET) Generate migrations (dev)                                         $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)db:generate:staging$(WHITE)           ║$(RESET) Generate migrations (staging)                                     $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)db:generate:production$(WHITE)        ║$(RESET) Generate migrations (production)                                  $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)db:migrate$(WHITE)                    ║$(RESET) Run migrations (dev)                                              $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)db:migrate:staging$(WHITE)            ║$(RESET) Run migrations (staging)                                          $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)db:migrate:production$(WHITE)         ║$(RESET) Run migrations (production)                                       $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)db:push$(WHITE)                       ║$(RESET) Push schema directly (dev)                                        $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)db:push:staging$(WHITE)               ║$(RESET) Push schema directly (staging)                                    $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)db:push:production$(WHITE)            ║$(RESET) Push schema directly (production)                                 $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)db:studio$(WHITE)                     ║$(RESET) Open Drizzle Studio (dev)                                         $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)db:studio:staging$(WHITE)             ║$(RESET) Open Drizzle Studio (staging)                                     $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)db:studio:production$(WHITE)          ║$(RESET) Open Drizzle Studio (production)                                  $(WHITE)║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╩═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(CYAN)DEVELOPMENT$(WHITE)                                                                                       ║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╦═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(GREEN)dev$(WHITE)                           ║$(RESET) Run all apps in dev mode                                          $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)dev:web$(WHITE)                       ║$(RESET) Run web app only                                                  $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)dev:astro$(WHITE)                     ║$(RESET) Run astro app only                                                $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)dev:api$(WHITE)                       ║$(RESET) Run API only                                                      $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)dev:share$(WHITE)                     ║$(RESET) Run Share URL shortener only                                      $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)dev:email$(WHITE)                     ║$(RESET) Run Email preview server only                                     $(WHITE)║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╩═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(CYAN)BUILD$(WHITE)                                                                                             ║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╦═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(GREEN)build$(WHITE)                         ║$(RESET) Build all apps                                                    $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)build:web$(WHITE)                     ║$(RESET) Build web app only                                                $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)build:astro$(WHITE)                   ║$(RESET) Build astro app only                                              $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)build:api$(WHITE)                     ║$(RESET) Build API only                                                    $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)build:share$(WHITE)                   ║$(RESET) Build Share URL shortener only                                    $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)preview:astro$(WHITE)                 ║$(RESET) Preview astro production build                                    $(WHITE)║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╩═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(CYAN)CODE QUALITY$(WHITE)                                                                                      ║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╦═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(GREEN)lint$(WHITE)                          ║$(RESET) Run linter                                                        $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)lint:fix$(WHITE)                      ║$(RESET) Run linter and fix issues                                         $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)format$(WHITE)                        ║$(RESET) Format all files                                                  $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)format:check$(WHITE)                  ║$(RESET) Check formatting                                                  $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)typecheck$(WHITE)                     ║$(RESET) Type check all packages                                           $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)check$(WHITE)                         ║$(RESET) Run all (lint + type + format)                                    $(WHITE)║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╩═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(CYAN)TESTING$(WHITE)                                                                                           ║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╦═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(GREEN)test$(WHITE)                          ║$(RESET) Run all tests                                                     $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)test:watch$(WHITE)                    ║$(RESET) Run tests in watch mode                                           $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)test:api$(WHITE)                      ║$(RESET) Test API endpoints                                                $(WHITE)║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╩═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(CYAN)STORYBOOK$(WHITE)                                                                                         ║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╦═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(GREEN)storybook:recorder$(WHITE)            ║$(RESET) Run Storybook for recorder app                                    $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)storybook:recorder:build$(WHITE)      ║$(RESET) Build Storybook for recorder app                                  $(WHITE)║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╩═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(CYAN)BACKGROUND JOBS (Trigger.dev)$(WHITE)                                                                    ║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╦═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(GREEN)trigger:login$(WHITE)                 ║$(RESET) Login to trigger.dev CLI                                          $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)trigger:whoami$(WHITE)                ║$(RESET) Show current trigger.dev user                                     $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)trigger:dev$(WHITE)                   ║$(RESET) Run trigger.dev dev server                                        $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)trigger:deploy$(WHITE)                ║$(RESET) Deploy tasks (dev)                                                $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)trigger:deploy:staging$(WHITE)        ║$(RESET) Deploy tasks (staging)                                            $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)trigger:deploy:production$(WHITE)     ║$(RESET) Deploy tasks (production)                                         $(WHITE)║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╩═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(CYAN)MAINTENANCE$(WHITE)                                                                                       ║$(RESET)"
	@echo "$(WHITE)╠═══════════════════════════════╦═══════════════════════════════════════════════════════════════════╣$(RESET)"
	@echo "$(WHITE)║ $(GREEN)clean$(WHITE)                         ║$(RESET) Remove build outputs and caches                                   $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)clean:all$(WHITE)                     ║$(RESET) Remove deps, builds, and caches                                   $(WHITE)║$(RESET)"
	@echo "$(WHITE)║ $(GREEN)clean:deep$(WHITE)                    ║$(RESET) Remove all node_modules and reinstall                             $(WHITE)║$(RESET)"
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

dev\:web: ## Run web app only
	@echo "$(MAGENTA)Starting web app (Next.js)...$(RESET)"
	@cd apps/web && bun dev

dev\:astro: ## Run astro app only
	@echo "$(MAGENTA)Starting Astro app...$(RESET)"
	@cd apps/astro-app && bun dev

dev\:api: ## Run API only
	@echo "$(MAGENTA)Starting Hono API...$(RESET)"
	@cd apps/api && bun dev

dev\:share: ## Run Share URL shortener only
	@echo "$(MAGENTA)Starting Share URL shortener...$(RESET)"
	@cd apps/share && bun dev

dev\:email: ## Run Email preview server only
	@echo "$(MAGENTA)Starting Email preview server...$(RESET)"
	@cd packages/email && bun dev

build: ## Build all apps
	@echo "$(BLUE)Building all apps...$(RESET)"
	@bun run build
	@echo "$(GREEN)Build complete!$(RESET)"

build\:web: ## Build web app only
	@echo "$(BLUE)Building web app...$(RESET)"
	@cd apps/web && bun run build
	@echo "$(GREEN)Web app built!$(RESET)"

build\:astro: ## Build astro app only
	@echo "$(BLUE)Building Astro app...$(RESET)"
	@cd apps/astro-app && bun run build
	@echo "$(GREEN)Astro app built!$(RESET)"

build\:api: ## Build API only
	@echo "$(BLUE)Building API...$(RESET)"
	@cd apps/api && bun run build
	@echo "$(GREEN)API built!$(RESET)"

build\:share: ## Build Share URL shortener only
	@echo "$(BLUE)Building Share URL shortener...$(RESET)"
	@cd apps/share && bun run build
	@echo "$(GREEN)Share URL shortener built!$(RESET)"

lint: ## Run linter
	@echo "$(YELLOW)Running linter...$(RESET)"
	@bun run lint
	@echo "$(GREEN)Linting complete!$(RESET)"

lint\:fix: ## Run linter and fix issues
	@echo "$(YELLOW)Running linter with auto-fix...$(RESET)"
	@bunx turbo lint -- --fix
	@echo "$(GREEN)Linting and fixes complete!$(RESET)"

format: ## Format all files
	@echo "$(YELLOW)Formatting code...$(RESET)"
	@bun run format
	@echo "$(GREEN)Formatting complete!$(RESET)"

format\:check: ## Check formatting
	@echo "$(YELLOW)Checking code formatting...$(RESET)"
	@bun run format:check

fmt: format ## Shortcut for format

fmt\:check: format\:check ## Shortcut for format:check

fmt\:fix: format\:fix ## Shortcut for format:fix

typecheck: ## Type check all packages
	@echo "$(BLUE)Running type check...$(RESET)"
	@bunx turbo typecheck
	@echo "$(GREEN)Type check complete!$(RESET)"

test: ## Run all tests
	@echo "$(CYAN)Running tests...$(RESET)"
	@bunx turbo test
	@echo "$(GREEN)Tests complete!$(RESET)"

test\:watch: ## Run tests in watch mode
	@echo "$(CYAN)Running tests in watch mode...$(RESET)"
	@bunx turbo test -- --watch

check: lint typecheck format\:check ## Run all checks
	@echo "$(GREEN)All checks passed!$(RESET)"

clean: ## Remove build outputs and caches
	@echo "$(YELLOW)Cleaning build outputs and caches...$(RESET)"
	@rm -rf .turbo
	@find . -name 'dist' -type d -prune -exec rm -rf '{}' +
	@find . -name '.next' -type d -prune -exec rm -rf '{}' +
	@find . -name '.astro' -type d -prune -exec rm -rf '{}' +
	@echo "$(GREEN)Clean complete!$(RESET)"

clean\:all: clean ## Remove deps, builds, and caches
	@echo "$(RED)Removing all dependencies...$(RESET)"
	@find . -name 'node_modules' -type d -prune -exec rm -rf '{}' +
	@rm -f bun.lockb
	@echo "$(GREEN)Everything cleaned!$(RESET)"

clean\:deep: ## Remove all node_modules and reinstall
	@echo "$(YELLOW)Starting deep clean...$(RESET)"
	@echo "$(RED)Removing all node_modules directories...$(RESET)"
	@rm -rf node_modules
	@rm -rf apps/*/node_modules
	@rm -rf packages/*/node_modules
	@echo "$(BLUE)Reinstalling dependencies...$(RESET)"
	@bun install
	@echo "$(GREEN)Deep clean complete!$(RESET)"

reset: clean\:all install ## Clean and reinstall everything
	@echo "$(GREEN)Project reset complete!$(RESET)"

preview\:astro: ## Preview astro production build
	@echo "$(MAGENTA)Previewing Astro production build...$(RESET)"
	@cd apps/astro-app && bun run preview

test\:api: ## Test API endpoints
	@echo "$(CYAN)Testing API endpoints...$(RESET)"
	@cd apps/api && ./test-api.sh

storybook\:recorder: ## Run Storybook for recorder app
	@echo "$(MAGENTA)Starting Storybook for recorder...$(RESET)"
	@cd apps/recorder && bun run storybook

storybook\:recorder\:build: ## Build Storybook for recorder app
	@echo "$(BLUE)Building Storybook for recorder...$(RESET)"
	@cd apps/recorder && bun run build-storybook
	@echo "$(GREEN)Storybook build complete!$(RESET)"

update: ## Update dependencies
	@echo "$(BLUE)Updating dependencies...$(RESET)"
	@bun update
	@echo "$(GREEN)Dependencies updated!$(RESET)"

env\:setup: ## Copy .env.example files to create .env files
	@echo "$(BLUE)Setting up environment files...$(RESET)"
	@if [ ! -f .env ]; then cp .env.example .env && echo "$(GREEN)✓$(RESET) Created .env"; else echo "$(YELLOW)⚠$(RESET) .env already exists"; fi
	@if [ ! -f apps/api/.env.development ]; then cp apps/api/.env.example apps/api/.env.development && echo "$(GREEN)✓$(RESET) Created apps/api/.env.development"; else echo "$(YELLOW)⚠$(RESET) apps/api/.env.development already exists"; fi
	@if [ ! -f apps/dash/.env.development ]; then cp apps/dash/.env.example apps/dash/.env.development && echo "$(GREEN)✓$(RESET) Created apps/dash/.env.development"; else echo "$(YELLOW)⚠$(RESET) apps/dash/.env.development already exists"; fi
	@if [ ! -f apps/home/.env ]; then cp apps/home/.env.example apps/home/.env && echo "$(GREEN)✓$(RESET) Created apps/home/.env"; else echo "$(YELLOW)⚠$(RESET) apps/home/.env already exists"; fi
	@if [ ! -f apps/recorder/.env ]; then cp apps/recorder/.env.example apps/recorder/.env && echo "$(GREEN)✓$(RESET) Created apps/recorder/.env"; else echo "$(YELLOW)⚠$(RESET) apps/recorder/.env already exists"; fi
	@echo "$(GREEN)Environment files setup complete!$(RESET)"
	@echo "$(YELLOW)Remember to update the values in each .env file$(RESET)"

env\:check: ## Check if .env files exist
	@echo "$(BLUE)Checking environment files...$(RESET)"
	@if [ -f .env ]; then echo "$(GREEN)✓$(RESET) .env exists"; else echo "$(RED)✗$(RESET) .env missing"; fi
	@if [ -f apps/api/.env.development ]; then echo "$(GREEN)✓$(RESET) apps/api/.env.development exists"; else echo "$(RED)✗$(RESET) apps/api/.env.development missing"; fi
	@if [ -f apps/dash/.env.development ]; then echo "$(GREEN)✓$(RESET) apps/dash/.env.development exists"; else echo "$(RED)✗$(RESET) apps/dash/.env.development missing"; fi
	@if [ -f apps/home/.env ]; then echo "$(GREEN)✓$(RESET) apps/home/.env exists"; else echo "$(RED)✗$(RESET) apps/home/.env missing"; fi
	@if [ -f apps/recorder/.env ]; then echo "$(GREEN)✓$(RESET) apps/recorder/.env exists"; else echo "$(RED)✗$(RESET) apps/recorder/.env missing"; fi

# Database commands - Development
db\:generate: ## Generate Drizzle migrations (dev)
	@echo "$(BLUE)Generating Drizzle migrations (development)...$(RESET)"
	@if [ ! -f apps/api/.env.development ]; then \
		echo "$(RED)Error: apps/api/.env.development not found$(RESET)"; \
		echo "$(YELLOW)Run 'make env:setup' first$(RESET)"; \
		exit 1; \
	fi
	@cd packages/db && export $$(grep -v '^#' ../../apps/api/.env.development | grep -v '^\s*$$' | sed 's/[[:space:]]*#.*//' | xargs) && bun run db:generate
	@echo "$(GREEN)Migrations generated!$(RESET)"

db\:migrate: ## Run database migrations (dev)
	@echo "$(BLUE)Running database migrations (development)...$(RESET)"
	@if [ ! -f apps/api/.env.development ]; then \
		echo "$(RED)Error: apps/api/.env.development not found$(RESET)"; \
		echo "$(YELLOW)Run 'make env:setup' first$(RESET)"; \
		exit 1; \
	fi
	@cd packages/db && export $$(grep -v '^#' ../../apps/api/.env.development | grep -v '^\s*$$' | sed 's/[[:space:]]*#.*//' | xargs) && bun run db:migrate
	@echo "$(GREEN)Migrations complete!$(RESET)"

db\:push: ## Push schema directly to DB (dev)
	@echo "$(YELLOW)Pushing schema to database (development)...$(RESET)"
	@if [ ! -f apps/api/.env.development ]; then \
		echo "$(RED)Error: apps/api/.env.development not found$(RESET)"; \
		echo "$(YELLOW)Run 'make env:setup' first$(RESET)"; \
		exit 1; \
	fi
	@cd packages/db && export $$(grep -v '^#' ../../apps/api/.env.development | grep -v '^\s*$$' | sed 's/[[:space:]]*#.*//' | xargs) && bun run db:push
	@echo "$(GREEN)Schema pushed!$(RESET)"

db\:studio: ## Open Drizzle Studio (dev)
	@echo "$(MAGENTA)Opening Drizzle Studio (development)...$(RESET)"
	@if [ ! -f apps/api/.env.development ]; then \
		echo "$(RED)Error: apps/api/.env.development not found$(RESET)"; \
		echo "$(YELLOW)Run 'make env:setup' first$(RESET)"; \
		exit 1; \
	fi
	@cd packages/db && export $$(grep -v '^#' ../../apps/api/.env.development | grep -v '^\s*$$' | sed 's/[[:space:]]*#.*//' | xargs) && bun run db:studio

# Database commands - Staging
db\:generate\:staging: ## Generate Drizzle migrations (staging)
	@echo "$(BLUE)Generating Drizzle migrations (staging)...$(RESET)"
	@if [ ! -f apps/api/.env.staging ]; then \
		echo "$(RED)Error: apps/api/.env.staging not found$(RESET)"; \
		exit 1; \
	fi
	@cd packages/db && export $$(grep -v '^#' ../../apps/api/.env.staging | grep -v '^\s*$$' | sed 's/[[:space:]]*#.*//' | xargs) && bun run db:generate
	@echo "$(GREEN)Migrations generated!$(RESET)"

db\:migrate\:staging: ## Run database migrations (staging)
	@echo "$(BLUE)Running database migrations (staging)...$(RESET)"
	@if [ ! -f apps/api/.env.staging ]; then \
		echo "$(RED)Error: apps/api/.env.staging not found$(RESET)"; \
		exit 1; \
	fi
	@cd packages/db && export $$(grep -v '^#' ../../apps/api/.env.staging | grep -v '^\s*$$' | sed 's/[[:space:]]*#.*//' | xargs) && bun run db:migrate
	@echo "$(GREEN)Migrations complete!$(RESET)"

db\:push\:staging: ## Push schema directly to DB (staging)
	@echo "$(YELLOW)Pushing schema to database (staging)...$(RESET)"
	@if [ ! -f apps/api/.env.staging ]; then \
		echo "$(RED)Error: apps/api/.env.staging not found$(RESET)"; \
		exit 1; \
	fi
	@cd packages/db && export $$(grep -v '^#' ../../apps/api/.env.staging | grep -v '^\s*$$' | sed 's/[[:space:]]*#.*//' | xargs) && bun run db:push
	@echo "$(GREEN)Schema pushed!$(RESET)"

db\:studio\:staging: ## Open Drizzle Studio (staging)
	@echo "$(MAGENTA)Opening Drizzle Studio (staging)...$(RESET)"
	@if [ ! -f apps/api/.env.staging ]; then \
		echo "$(RED)Error: apps/api/.env.staging not found$(RESET)"; \
		exit 1; \
	fi
	@cd packages/db && export $$(grep -v '^#' ../../apps/api/.env.staging | grep -v '^\s*$$' | sed 's/[[:space:]]*#.*//' | xargs) && bun run db:studio

# Database commands - Production
db\:generate\:production: ## Generate Drizzle migrations (production)
	@echo "$(BLUE)Generating Drizzle migrations (production)...$(RESET)"
	@if [ ! -f apps/api/.env.production ]; then \
		echo "$(RED)Error: apps/api/.env.production not found$(RESET)"; \
		exit 1; \
	fi
	@cd packages/db && export $$(grep -v '^#' ../../apps/api/.env.production | grep -v '^\s*$$' | sed 's/[[:space:]]*#.*//' | xargs) && bun run db:generate
	@echo "$(GREEN)Migrations generated!$(RESET)"

db\:migrate\:production: ## Run database migrations (production)
	@echo "$(BLUE)Running database migrations (production)...$(RESET)"
	@if [ ! -f apps/api/.env.production ]; then \
		echo "$(RED)Error: apps/api/.env.production not found$(RESET)"; \
		exit 1; \
	fi
	@cd packages/db && export $$(grep -v '^#' ../../apps/api/.env.production | grep -v '^\s*$$' | sed 's/[[:space:]]*#.*//' | xargs) && bun run db:migrate
	@echo "$(GREEN)Migrations complete!$(RESET)"

db\:push\:production: ## Push schema directly to DB (production)
	@echo "$(RED)Pushing schema to database (production)...$(RESET)"
	@echo "$(RED)WARNING: This will push schema directly to PRODUCTION database!$(RESET)"
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ] || exit 1
	@if [ ! -f apps/api/.env.production ]; then \
		echo "$(RED)Error: apps/api/.env.production not found$(RESET)"; \
		exit 1; \
	fi
	@cd packages/db && export $$(grep -v '^#' ../../apps/api/.env.production | grep -v '^\s*$$' | sed 's/[[:space:]]*#.*//' | xargs) && bun run db:push
	@echo "$(GREEN)Schema pushed!$(RESET)"

db\:studio\:production: ## Open Drizzle Studio (production)
	@echo "$(MAGENTA)Opening Drizzle Studio (production)...$(RESET)"
	@if [ ! -f apps/api/.env.production ]; then \
		echo "$(RED)Error: apps/api/.env.production not found$(RESET)"; \
		exit 1; \
	fi
	@cd packages/db && export $$(grep -v '^#' ../../apps/api/.env.production | grep -v '^\s*$$' | sed 's/[[:space:]]*#.*//' | xargs) && bun run db:studio

# Trigger.dev commands
trigger\:login: ## Login to trigger.dev CLI
	@echo "$(BLUE)Logging in to trigger.dev...$(RESET)"
	@cd apps/api && npx trigger.dev@latest login
	@echo "$(GREEN)Login complete!$(RESET)"

trigger\:whoami: ## Show current trigger.dev user
	@echo "$(BLUE)Checking trigger.dev identity...$(RESET)"
	@cd apps/api && npx trigger.dev@latest whoami

trigger\:dev: ## Run trigger.dev dev server
	@echo "$(MAGENTA)Starting trigger.dev dev server...$(RESET)"
	@if [ ! -f apps/api/.env.development ]; then \
		echo "$(RED)Error: apps/api/.env.development not found$(RESET)"; \
		echo "$(YELLOW)Run 'make env:setup' first$(RESET)"; \
		exit 1; \
	fi
	@cd apps/api && export $$(grep -v '^#' .env.development | grep -v '^\s*$$' | sed 's/[[:space:]]*#.*//' | xargs) && npx trigger.dev@latest dev

trigger\:deploy: ## Deploy tasks to trigger.dev (dev)
	@echo "$(BLUE)Deploying tasks to trigger.dev (development)...$(RESET)"
	@if [ ! -f apps/api/.env.development ]; then \
		echo "$(RED)Error: apps/api/.env.development not found$(RESET)"; \
		echo "$(YELLOW)Run 'make env:setup' first$(RESET)"; \
		exit 1; \
	fi
	@cd apps/api && export $$(grep -v '^#' .env.development | grep -v '^\s*$$' | sed 's/[[:space:]]*#.*//' | xargs) && npx trigger.dev@latest deploy
	@echo "$(GREEN)Deployment complete!$(RESET)"

trigger\:deploy\:staging: ## Deploy tasks to trigger.dev (staging)
	@echo "$(BLUE)Deploying tasks to trigger.dev (staging)...$(RESET)"
	@if [ ! -f apps/api/.env.staging ]; then \
		echo "$(RED)Error: apps/api/.env.staging not found$(RESET)"; \
		exit 1; \
	fi
	@cd apps/api && export $$(grep -v '^#' .env.staging | grep -v '^\s*$$' | sed 's/[[:space:]]*#.*//' | xargs) && npx trigger.dev@latest deploy
	@echo "$(GREEN)Deployment complete!$(RESET)"

trigger\:deploy\:production: ## Deploy tasks to trigger.dev (production)
	@echo "$(RED)Deploying tasks to trigger.dev (production)...$(RESET)"
	@echo "$(RED)WARNING: This will deploy to PRODUCTION!$(RESET)"
	@read -p "Are you sure? [y/N] " confirm && [ "$$confirm" = "y" ] || exit 1
	@if [ ! -f apps/api/.env.production ]; then \
		echo "$(RED)Error: apps/api/.env.production not found$(RESET)"; \
		exit 1; \
	fi
	@cd apps/api && export $$(grep -v '^#' .env.production | grep -v '^\s*$$' | sed 's/[[:space:]]*#.*//' | xargs) && npx trigger.dev@latest deploy
	@echo "$(GREEN)Deployment complete!$(RESET)"

i: install ## Shortcut for install
d: dev ## Shortcut for dev
b: build ## Shortcut for build
l: lint ## Shortcut for lint
f: format ## Shortcut for format
t: test ## Shortcut for test
c: check ## Shortcut for check
