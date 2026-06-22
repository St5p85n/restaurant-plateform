pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = 'votre-dockerhub-username'
        PROJECT_NAME = 'restaurant-platform'
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', url: 'https://github.com/votre-repo/restaurant-platform.git'
            }
        }

        stage('Build Backend Services') {
            parallel {
                stage('Build Commande') {
                    steps {
                        dir('back') {
                            sh 'mvn clean package -DskipTests'
                        }
                    }
                }
                stage('Build Paiement') {
                    steps {
                        dir('paiement') {
                            sh 'mvn clean package -DskipTests'
                        }
                    }
                }
                stage('Build Livraison') {
                    steps {
                        dir('livraison') {
                            sh 'mvn clean package -DskipTests'
                        }
                    }
                }
                stage('Build ApiGateway') {
                    steps {
                        dir('ApiGateWay') {
                            sh 'mvn clean package -DskipTests'
                        }
                    }
                }
                stage('Build Eureka') {
                    steps {
                        dir('EurekaServerResgitry') {
                            sh 'mvn clean package -DskipTests'
                        }
                    }
                }
            }
        }

        stage('Build Frontend') {
            steps {
                dir('frontend') {
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }

        stage('Build Docker Images') {
            parallel {
                stage('Docker Commande') {
                    steps {
                        script {
                            docker.build("${env.DOCKER_REGISTRY}/commande:latest", "./back")
                        }
                    }
                }
                stage('Docker Paiement') {
                    steps {
                        script {
                            docker.build("${env.DOCKER_REGISTRY}/paiement:latest", "./paiement")
                        }
                    }
                }
                stage('Docker Livraison') {
                    steps {
                        script {
                            docker.build("${env.DOCKER_REGISTRY}/livraison:latest", "./livraison")
                        }
                    }
                }
                stage('Docker ApiGateway') {
                    steps {
                        script {
                            docker.build("${env.DOCKER_REGISTRY}/apigateway:latest", "./ApiGateWay")
                        }
                    }
                }
                stage('Docker Eureka') {
                    steps {
                        script {
                            docker.build("${env.DOCKER_REGISTRY}/eureka:latest", "./EurekaServerResgitry")
                        }
                    }
                }
                stage('Docker Frontend') {
                    steps {
                        script {
                            docker.build("${env.DOCKER_REGISTRY}/frontend:latest", "./frontend")
                        }
                    }
                }
            }
        }

        stage('Push to Docker Hub') {
            steps {
                script {
                    docker.withRegistry('', 'docker-hub-credentials') {
                        docker.image("${env.DOCKER_REGISTRY}/commande:latest").push()
                        docker.image("${env.DOCKER_REGISTRY}/paiement:latest").push()
                        docker.image("${env.DOCKER_REGISTRY}/livraison:latest").push()
                        docker.image("${env.DOCKER_REGISTRY}/apigateway:latest").push()
                        docker.image("${env.DOCKER_REGISTRY}/eureka:latest").push()
                        docker.image("${env.DOCKER_REGISTRY}/frontend:latest").push()
                    }
                }
            }
        }

        stage('Deploy with Docker Compose') {
            steps {
                script {
                    sh '''
                        docker-compose down
                        docker-compose pull
                        docker-compose up -d
                    '''
                }
            }
        }
    }

    post {
        success {
            echo 'Deployment successful!'
        }
        failure {
            echo 'Deployment failed!'
            mail to: 'admin@example.com',
                    subject: "Pipeline failed: ${env.JOB_NAME}",
                    body: "The pipeline ${env.JOB_NAME} failed."
        }
    }
}