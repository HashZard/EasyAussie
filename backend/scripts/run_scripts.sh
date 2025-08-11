#!/bin/bash
# filepath: /Users/zard/VScodeProject/EasyAussie/deploy/run_scripts.sh

# =============================================================================
# EasyAussie 脚本管理器
# 用于运行 backend/scripts 目录下的 Python 脚本
# =============================================================================

# 配置路径
PROJECT_PATH="/var/www/EasyAussie"
SCRIPTS_PATH="$PROJECT_PATH/backend/scripts"
VENV_PATH="$PROJECT_PATH/venv"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 显示横幅
function show_banner() {
    echo -e "${BLUE}=====================================${NC}"
    echo -e "${BLUE}    EasyAussie 脚本管理器${NC}"
    echo -e "${BLUE}=====================================${NC}"
    echo ""
}

# 显示使用说明
function show_usage() {
    echo -e "${YELLOW}使用说明:${NC}"
    echo "  $0                    - 显示所有可用脚本并选择执行"
    echo "  $0 --list             - 列出所有可用脚本"
    echo "  $0 --run <script>     - 直接运行指定脚本"
    echo "  $0 --help             - 显示此帮助信息"
    echo ""
    echo -e "${YELLOW}示例:${NC}"
    echo "  $0                                    # 交互式选择脚本"
    echo "  $0 --run init_admin.py               # 直接运行管理员初始化"
    echo "  $0 --run migrate_user_fields.py      # 直接运行用户字段迁移"
    echo ""
}

# 检查环境
function check_environment() {
    # 检查项目目录
    if [ ! -d "$PROJECT_PATH" ]; then
        echo -e "${RED}❌ 错误: 项目目录不存在: $PROJECT_PATH${NC}"
        echo -e "${YELLOW}💡 提示: 请检查 PROJECT_PATH 配置或在正确的服务器上运行${NC}"
        exit 1
    fi

    # 检查脚本目录
    if [ ! -d "$SCRIPTS_PATH" ]; then
        echo -e "${RED}❌ 错误: 脚本目录不存在: $SCRIPTS_PATH${NC}"
        exit 1
    fi

    # 检查虚拟环境
    if [ ! -d "$VENV_PATH" ]; then
        echo -e "${YELLOW}⚠️ 警告: 虚拟环境不存在: $VENV_PATH${NC}"
        echo -e "${YELLOW}💡 提示: 将使用系统 Python 环境${NC}"
    fi

    echo -e "${GREEN}✅ 环境检查通过${NC}"
}

# 激活虚拟环境
function activate_venv() {
    if [ -d "$VENV_PATH" ]; then
        echo -e "${CYAN}🐍 激活虚拟环境...${NC}"
        source "$VENV_PATH/bin/activate" || {
            echo -e "${RED}❌ 虚拟环境激活失败${NC}"
            echo -e "${YELLOW}💡 继续使用系统 Python${NC}"
        }
    fi
}

# 扫描可用脚本
function scan_scripts() {
    local scripts=()
    
    # 查找所有 .py 文件（排除 __init__.py）
    while IFS= read -r -d '' file; do
        local basename=$(basename "$file")
        if [ "$basename" != "__init__.py" ]; then
            scripts+=("$basename")
        fi
    done < <(find "$SCRIPTS_PATH" -name "*.py" -type f -print0)

    echo "${scripts[@]}"
}

# 获取脚本描述
function get_script_description() {
    local script_file="$1"
    local script_path="$SCRIPTS_PATH/$script_file"
    
    # 从文件开头的注释中提取描述
    local description=$(head -10 "$script_path" | grep -E '^"""' -A 5 | grep -v '^"""' | head -1 | sed 's/^[[:space:]]*//')
    
    if [ -z "$description" ]; then
        # 如果没有找到描述，使用文件名作为描述
        case "$script_file" in
            "init_admin.py")
                description="初始化管理员账户和角色"
                ;;
            "migrate_user_fields.py")
                description="迁移用户表字段（添加新字段）"
                ;;
            *)
                description="Python 脚本"
                ;;
        esac
    fi
    
    echo "$description"
}

# 列出所有脚本
function list_scripts() {
    echo -e "${CYAN}📋 可用脚本列表:${NC}"
    echo ""
    
    local scripts=($(scan_scripts))
    
    if [ ${#scripts[@]} -eq 0 ]; then
        echo -e "${YELLOW}⚠️ 未找到任何 Python 脚本${NC}"
        return 1
    fi
    
    local index=1
    for script in "${scripts[@]}"; do
        local description=$(get_script_description "$script")
        printf "${GREEN}%2d.${NC} ${BLUE}%-25s${NC} - %s\n" "$index" "$script" "$description"
        ((index++))
    done
    
    echo ""
    echo -e "${PURPLE}总计: ${#scripts[@]} 个脚本${NC}"
}

# 运行脚本
function run_script() {
    local script_name="$1"
    local script_path="$SCRIPTS_PATH/$script_name"
    
    # 检查脚本是否存在
    if [ ! -f "$script_path" ]; then
        echo -e "${RED}❌ 错误: 脚本不存在: $script_name${NC}"
        return 1
    fi
    
    # 显示脚本信息
    local description=$(get_script_description "$script_name")
    echo -e "${CYAN}🚀 准备运行脚本:${NC}"
    echo -e "   ${BLUE}文件:${NC} $script_name"
    echo -e "   ${BLUE}描述:${NC} $description"
    echo -e "   ${BLUE}路径:${NC} $script_path"
    echo ""
    
    # 确认执行
    read -p "$(echo -e ${YELLOW}确定要运行此脚本吗？ [y/N]: ${NC})" -n 1 -r
    echo
    
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}❌ 用户取消执行${NC}"
        return 0
    fi
    
    # 激活虚拟环境
    activate_venv
    
    # 运行脚本
    echo -e "${CYAN}▶️ 开始执行脚本...${NC}"
    echo -e "${PURPLE}=================================================${NC}"
    
    cd "$PROJECT_PATH" || {
        echo -e "${RED}❌ 无法进入项目目录${NC}"
        return 1
    }
    
    # 设置环境变量
    export FLASK_APP=backend.app:create_app
    export FLASK_ENV=production
    
    # 执行脚本
    python3 "$script_path"
    local exit_code=$?
    
    echo -e "${PURPLE}=================================================${NC}"
    
    if [ $exit_code -eq 0 ]; then
        echo -e "${GREEN}✅ 脚本执行成功${NC}"
    else
        echo -e "${RED}❌ 脚本执行失败 (退出码: $exit_code)${NC}"
    fi
    
    return $exit_code
}

# 交互式选择脚本
function interactive_select() {
    local scripts=($(scan_scripts))
    
    if [ ${#scripts[@]} -eq 0 ]; then
        echo -e "${YELLOW}⚠️ 未找到任何 Python 脚本${NC}"
        return 1
    fi
    
    # 显示脚本列表
    list_scripts
    
    # 提示用户选择
    echo -e "${YELLOW}请选择要运行的脚本 (输入数字):${NC}"
    read -p "选择 [1-${#scripts[@]}] 或 'q' 退出: " choice
    
    # 处理用户输入
    if [[ "$choice" == "q" || "$choice" == "Q" ]]; then
        echo -e "${YELLOW}👋 退出脚本管理器${NC}"
        return 0
    fi
    
    # 验证输入是否为数字
    if ! [[ "$choice" =~ ^[0-9]+$ ]]; then
        echo -e "${RED}❌ 错误: 请输入有效的数字${NC}"
        return 1
    fi
    
    # 验证数字范围
    if [ "$choice" -lt 1 ] || [ "$choice" -gt ${#scripts[@]} ]; then
        echo -e "${RED}❌ 错误: 选择超出范围 (1-${#scripts[@]})${NC}"
        return 1
    fi
    
    # 获取选中的脚本
    local selected_script="${scripts[$((choice-1))]}"
    
    # 运行脚本
    run_script "$selected_script"
}

# 主函数
function main() {
    show_banner
    check_environment
    
    case "${1:-}" in
        --help|-h)
            show_usage
            ;;
        --list|-l)
            list_scripts
            ;;
        --run|-r)
            if [ -z "${2:-}" ]; then
                echo -e "${RED}❌ 错误: 请指定要运行的脚本名称${NC}"
                echo ""
                show_usage
                exit 1
            fi
            run_script "$2"
            ;;
        "")
            # 无参数，进入交互模式
            interactive_select
            ;;
        *)
            echo -e "${RED}❌ 错误: 未知参数 '$1'${NC}"
            echo ""
            show_usage
            exit 1
            ;;
    esac
}

# 脚本入口
main "$@"